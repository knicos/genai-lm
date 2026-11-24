import type { Statement } from '@xapi/xapi';
import { v4 as uuidv4 } from 'uuid';
import type {
    AuditTool,
    SelectionContext,
    AlternativeOption,
    AlternativeSelection,
    MatchStatistics,
    MatchResult,
} from './types';
import { getRecording, flushQueue } from './delivery';
import { getResearchIdentity, initializeResearchIdentity } from './identity';
import type { ResearchIdentity } from './identity';
import type { TeachableLLM, GeneratorConversation, IBeam, IGenerateOptions } from '@genai-fi/nanogpt';
import type { PrettyResult } from '../../utilities/search/prettyResult';

// Stable namespace for research logging identifiers.
const namespace = 'https://lm.gen-ai.fi/xapi';
const schemaVersion = '1';

interface Generation {
    generationId: string;
    promptId: string;
    outputId: string;
    stopped: boolean;
}

interface GenerationTrigger {
    promptId: string;
    triggeringEventId: string;
    trigger: 'prompt' | 'alternative';
    settings: IGenerateOptions;
    sourceOutputId?: string;
}

interface BeamList {
    selection: SelectionContext;
    optionsListId: string;
    options: AlternativeOption[];
    previous: number;
    moreEventId?: string;
    snapshot: string;
}

interface MatchSearch {
    selection: SelectionContext;
    totalDisplayed: number;
    statistics?: MatchStatistics;
    moreEventId?: string;
}

let instance: Logger | null = null;

export class Logger {
    private model: TeachableLLM | null = null;
    private active = false;
    private pendingGeneration: GenerationTrigger | null = null;
    private generations = new Map<string, Generation>();
    private outputs = new WeakMap<GeneratorConversation, { outputId: string; promptId: string }>();
    private outputPrompts = new Map<string, string>();
    private beams = new Map<string, BeamList>();
    private searches = new Map<string, MatchSearch>();

    private constructor(private readonly identity: ResearchIdentity) {}

    // Create one shared service after identification succeeds.
    static async get(): Promise<Logger | null> {
        const identity = await initializeResearchIdentity();
        if (!identity) return null;

        if (!instance) {
            instance = new Logger(identity);
            void flushQueue();
        }

        return instance;
    }

    // Expose the participant number without UI setup logic.
    get participantNumber(): number {
        return this.identity.participantNumber;
    }

    // Limit observation to the audit phase.
    setAuditActive(active: boolean): void {
        if (this.active === active) return;

        this.active = active;

        if (active) {
            const recording = getRecording();
            if (recording.sequence === 0) this.inquiryStarted('none');
            else this.inquiryResumed('none');
        } else {
            this.pendingGeneration = null;
            this.generations.clear();
            this.beams.clear();
            this.searches.clear();
        }
    }

    // Observe the current model without altering its calculation methods.
    setModel(model: TeachableLLM | null): void {
        if (model === this.model) return;

        this.detachModel();
        this.pendingGeneration = null;
        this.generations.clear();
        this.beams.clear();
        this.searches.clear();
        this.outputs = new WeakMap();
        this.outputPrompts.clear();

        this.model = model;
        if (!model) return;

        model.responses.on('generating', this.onGenerating);
        model.responses.on('done', this.onGenerationDone);
        model.responses.on('error', this.onGenerationError);
        // model.beaming.on('progress', this.onBeams);
        model.beaming.on('done', this.onBeams);
    }

    // Remove only listeners owned by this service.
    private detachModel(): void {
        const model = this.model;
        if (!model) return;

        model.responses.off('generating', this.onGenerating);
        model.responses.off('done', this.onGenerationDone);
        model.responses.off('error', this.onGenerationError);
        // model.beaming.off('progress', this.onBeams);
        model.beaming.off('done', this.onBeams);
    }

    // Start recording when the model reports generation, using the reported user trigger.
    private onGenerating = (id: string): void => {
        if (!this.active || !this.model || !this.pendingGeneration || this.generations.has(id)) return;

        const trigger = this.pendingGeneration;
        this.pendingGeneration = null;

        const generation = {
            generationId: uuidv4(),
            promptId: trigger.promptId,
            outputId: uuidv4(),
            stopped: false,
        };
        this.generations.set(id, generation);
        this.generationStarted({ ...trigger, generationId: generation.generationId });
    };

    // Bind continuation responses whose start event uses the previous response ID.
    generationCreated(responseId: string, startId = responseId): void {
        const generation = this.generations.get(startId);
        if (!generation || !this.model) return;

        this.generations.delete(startId);
        this.generations.set(responseId, generation);
        if (this.model.responses.getResponse(responseId)?.done) this.onGenerationDone(responseId);
    }

    // Distinguish an explicit stop from the model's ordinary done event.
    generationStopRequested(responseId: string): void {
        const generation = this.generations.get(responseId);
        if (generation) generation.stopped = true;
    }

    // Record a rejected request when the model does not emit an error event.
    generationRequestFailed(error: unknown = new Error('Generation did not start.')): void {
        const failure = error instanceof Error ? error : new Error(String(error));
        if (this.pendingGeneration) {
            const trigger = this.pendingGeneration;
            this.pendingGeneration = null;
            this.generationFailed({
                generationId: uuidv4(),
                promptId: trigger.promptId,
                errorCategory: failure.name,
                errorMessage: failure.message,
            });
        } else {
            this.onGenerationError(failure);
        }
    }

    // Read final output from the model rather than adding completion callbacks to components.
    private onGenerationDone = (id: string): void => {
        const generation = this.generations.get(id);
        if (!generation || !this.model || !this.active) return;

        const output: GeneratorConversation[] | null | undefined = this.model.responses.getResponse(id)?.output;
        if (!output) return;

        this.generations.delete(id);
        output.forEach((part) => this.outputs.set(part, generation));
        this.outputPrompts.set(generation.outputId, generation.promptId);

        const data = {
            generationId: generation.generationId,
            promptId: generation.promptId,
            outputId: generation.outputId,
            text: output.map((part) => part.content).join('\n'),
        };
        if (generation.stopped) this.generationStopped(data);
        else this.generationCompleted(data);
    };

    // Attribute ID-less errors only when exactly one observed generation is running.
    private onGenerationError = (error: Error): void => {
        if (this.generations.size !== 1) return;

        const [id, generation] = Array.from(this.generations.entries())[0];
        const output: GeneratorConversation[] | null | undefined = this.model?.responses.getResponse(id)?.output;

        this.generations.delete(id);
        this.generationFailed({
            ...generation,
            text: output?.map((part) => part.content).join('\n'),
            errorCategory: error.name,
            errorMessage: error.message,
        });
    };

    // Build selection context only when a tool uses the highlighted text.
    selectionContext(
        conversation: GeneratorConversation[],
        selection: { conversationIndex: number; startToken: number; endToken: number }
    ): SelectionContext | null {
        if (!this.active) return null;

        const part = conversation[selection.conversationIndex];
        if (!part) return null;

        let output = this.outputs.get(part);
        if (!output && this.model) {
            for (const [id, generation] of this.generations) {
                if (this.model.responses.getResponse(id)?.output?.includes(part)) {
                    output = generation;
                    this.outputPrompts.set(generation.outputId, generation.promptId);
                    break;
                }
            }
        }

        if (!output) return null;
        return {
            selectionId: uuidv4(),
            outputId: output.outputId,
            selectedText:
                part._output
                    ?.slice(selection.startToken, selection.endToken + 1)
                    .map((token) => token.text)
                    .join('') ?? '',
            startToken: selection.startToken,
            endToken: selection.endToken,
        };
    }

    // Associate a beam job with the selection that caused it.
    watchBeams(
        id: string,
        conversation: GeneratorConversation[],
        selectedTokens: { conversationIndex: number; startToken: number; endToken: number }
    ): void {
        const selection = this.selectionContext(conversation, selectedTokens);
        if (!selection) return;

        this.beams.clear();
        const optionsListId = uuidv4();
        this.beams.set(id, { selection, optionsListId, options: [], previous: 0, snapshot: '' });
        this.alternativesRequested({ ...selection, optionsListId });
    }

    // Record the next batch request while model events supply the options.
    beamMore(id: string): void {
        const list = this.beams.get(id);
        if (!list || !this.active) return;

        list.previous = list.options.length;
        list.moreEventId =
            this.moreAlternativesClicked({
                ...list.selection,
                optionsListId: list.optionsListId,
                previouslyDisplayed: list.previous,
            }) ?? undefined;
        list.snapshot = '';
    }

    // Record changing beam options, skipping identical progress and done payloads.
    private onBeams = (id: string, beams: IBeam[]): void => {
        const list = this.beams.get(id);
        if (!list || !this.active) return;

        const options = beams.map((beam, index) => ({
            text: beam.text,
            score: beam.score,
            position: list.previous + index + 1,
        }));
        const snapshot = JSON.stringify(options);
        if (snapshot === list.snapshot) return;

        list.snapshot = snapshot;
        list.options = [...list.options.slice(0, list.previous), ...options];

        const context = { ...list.selection, optionsListId: list.optionsListId, totalDisplayed: list.options.length };
        if (list.moreEventId)
            this.moreAlternativesDisplayed({ ...context, triggeringEventId: list.moreEventId, addedOptions: options });
        else this.alternativesDisplayed({ ...context, options });
    };

    // Record the actual clicked option and link the following generation to it.
    beamSelect(
        id: string | null,
        alternativeText: string,
        position: number,
        settings: IGenerateOptions = {}
    ): string | null {
        if (!id) return null;

        const list = this.beams.get(id);
        if (!list || !this.active) return null;

        const eventId = this.alternativeSelected({
            ...list.selection,
            optionsListId: list.optionsListId,
            originalText: list.selection.selectedText,
            alternativeText,
            alternativeIndex: position,
        });

        const promptId = this.outputPrompts.get(list.selection.outputId);
        if (eventId && promptId)
            this.pendingGeneration = {
                promptId,
                triggeringEventId: eventId,
                trigger: 'alternative',
                sourceOutputId: list.selection.outputId,
                settings: { ...settings, continuation: true, background: true },
            };

        return eventId;
    }

    // Build and queue one event.
    private logEvent(
        action: string,
        activity: string,
        label: string,
        details: object = {},
        response?: string
    ): string | null {
        const identity = getResearchIdentity();
        if (!this.active || identity?.actorId !== this.identity.actorId) return null;

        try {
            const state = getRecording();

            const statement: Statement = {
                id: uuidv4(),
                timestamp: new Date().toISOString(),
                actor: { objectType: 'Agent', account: { homePage: namespace, name: identity.actorId } },
                verb: { id: `${namespace}/verbs/${action}`, display: { 'en-GB': action.replaceAll('-', ' ') } },
                object: {
                    objectType: 'Activity',
                    id: `${namespace}/activities/${activity}`,
                    definition: { name: { 'en-GB': label } },
                },
                context: {
                    registration: state.sessionId,
                    extensions: {
                        [`${namespace}/extensions/sequence`]: ++state.sequence,
                        [`${namespace}/extensions/research-session-id`]: identity.researchSessionId,
                        [`${namespace}/extensions/phase`]: 'behaviour-inquiry',
                        [`${namespace}/extensions/schema-version`]: schemaVersion,
                    },
                },
                result: {
                    ...(response !== undefined ? { response } : {}),
                    extensions: { [`${namespace}/extensions/details`]: JSON.parse(JSON.stringify(details)) },
                },
            };

            state.queue.push({ statement, attempts: 0, retryAt: 0, failed: false, error: null });
            void flushQueue();

            return statement.id ?? null;
        } catch (error) {
            console.error(
                '[xAPI] Event not safely recorded:',
                error instanceof Error ? error.message : 'Unknown error'
            );
            return null;
        }
    }

    // Start an inquiry without discarding pending events.
    private inquiryStarted(initialTool: AuditTool): string | null {
        if (getResearchIdentity()?.actorId !== this.identity.actorId) return null;

        return this.logEvent('started', 'inquiry', 'Behaviour Inquiry', { initialTool });
    }

    // Resume the inquiry when returning to the audit view.
    private inquiryResumed(initialTool: AuditTool): string | null {
        return this.logEvent('resumed', 'inquiry', 'Behaviour Inquiry', { initialTool });
    }

    // Record the full submitted prompt.
    promptSubmitted(text: string, settings: IGenerateOptions = {}): string | null {
        if (!this.model) return null;

        const promptId = uuidv4();
        const eventId = this.logEvent('submitted', 'prompt', 'Prompt', { promptId, text, settings }, text);
        if (eventId) this.pendingGeneration = { promptId, triggeringEventId: eventId, trigger: 'prompt', settings };

        return eventId;
    }

    // Link a generation attempt to its trigger.
    private generationStarted(data: {
        generationId: string;
        promptId: string;
        triggeringEventId: string;
        trigger: 'prompt' | 'alternative';
        sourceOutputId?: string;
        settings: IGenerateOptions;
    }): string | null {
        return this.logEvent('started', 'generation', 'Text generation', data);
    }

    // Record the entire completed output.
    private generationCompleted(data: {
        generationId: string;
        promptId: string;
        outputId: string;
        text: string;
    }): string | null {
        return this.logEvent('completed', 'generation', 'Text generation', data, data.text);
    }

    // Record generation stopped by the learner.
    private generationStopped(data: {
        generationId: string;
        promptId: string;
        outputId: string;
        text: string;
    }): string | null {
        return this.logEvent('stopped', 'generation', 'Text generation', data, data.text);
    }

    // Record generation failure and available partial text.
    private generationFailed(data: {
        generationId: string;
        promptId: string;
        outputId?: string;
        text?: string;
        errorCategory: string;
        errorMessage: string;
    }): string | null {
        return this.logEvent('failed', 'generation', 'Text generation', data, data.text);
    }

    // Record each Alternatives toolbar click.
    alternativesToolClicked(): string | null {
        return this.logEvent('clicked', 'alternatives-tool', 'Alternatives tool');
    }

    // Record a selection used to request alternatives.
    private alternativesRequested(data: SelectionContext & { optionsListId: string }): string | null {
        return this.logEvent('requested', 'alternatives', 'Alternatives', data);
    }

    // Record the initial displayed alternatives.
    private alternativesDisplayed(data: {
        optionsListId: string;
        selectionId: string;
        outputId: string;
        options: AlternativeOption[];
        totalDisplayed: number;
    }): string | null {
        return this.logEvent('displayed', 'alternatives', 'Alternatives', data);
    }

    // Record the clicked alternative.
    private alternativeSelected(selection: AlternativeSelection): string | null {
        return this.logEvent(
            'selected',
            'displayed-alternative',
            'Displayed alternative',
            selection,
            selection.alternativeText
        );
    }

    // Record a request for more alternatives.
    private moreAlternativesClicked(data: {
        optionsListId: string;
        selectionId: string;
        outputId: string;
        previouslyDisplayed: number;
    }): string | null {
        return this.logEvent('clicked', 'more-alternatives', 'More alternatives', data);
    }

    // Record additional alternatives in the same list.
    private moreAlternativesDisplayed(data: {
        optionsListId: string;
        selectionId: string;
        outputId: string;
        triggeringEventId: string;
        addedOptions: AlternativeOption[];
        totalDisplayed: number;
    }): string | null {
        return this.logEvent('displayed', 'more-alternatives', 'Additional alternatives', {
            ...data,
            addedCount: data.addedOptions.length,
        });
    }

    // Record each Data Match toolbar click.
    dataMatchToolClicked(): string | null {
        return this.logEvent('clicked', 'data-match-tool', 'Data Match tool');
    }

    // Start a linked search without making the component allocate identifiers.
    dataMatchRequested(
        selection: SelectionContext | null | undefined,
        searchTokens?: readonly { text: string }[]
    ): string | null {
        if (!selection) return null;

        const searchText = searchTokens?.map((token) => token.text).join('') ?? selection.selectedText;
        const searchId = uuidv4();
        if (
            !this.logEvent('requested', 'data-match-search', 'Data Match search', {
                ...selection,
                searchId,
                searchText,
            })
        )
            return null;

        this.searches.set(searchId, { selection, totalDisplayed: 0 });
        return searchId;
    }

    // Link a preparation failure to the original selection before a query exists.
    dataMatchPreparationFailed(selection: SelectionContext | null | undefined, error: unknown): void {
        const searchId = this.dataMatchRequested(selection);
        if (searchId) this.dataMatchFailed(searchId, error);
    }

    // Describe only the excerpts actually presented by the search UI.
    private matchResults(results: PrettyResult[], start = 0): MatchResult[] {
        return results.map((result, index) => ({
            resultId: uuidv4(),
            position: start + index + 1,
            excerpt:
                result.prefixFragments.map((part) => part.text).join('') +
                result.text +
                result.suffixFragments.map((part) => part.text).join(''),
        }));
    }

    // Record initial results, including a successful search with zero matches.
    dataMatchResultsDisplayed(
        searchId: string,
        resultInfo: { estimatedMatches: number; exactMatches: number; results: readonly unknown[] },
        results: PrettyResult[]
    ): void {
        const search = this.searches.get(searchId);
        if (!search) return;

        const statistics: MatchStatistics = {
            approximateExactMatches: resultInfo.estimatedMatches,
            partialMatches: resultInfo.results.length - resultInfo.exactMatches,
        };
        search.statistics = statistics;
        search.totalDisplayed = results.length;

        this.logEvent('displayed', 'data-match-results', 'Data Match results', {
            ...search.selection,
            searchId,
            statistics,
            results: this.matchResults(results),
            totalDisplayed: results.length,
        });
    }

    // Distinguish a failed search from zero matches.
    dataMatchFailed(searchId: string, error: unknown): void {
        const search = this.searches.get(searchId);
        if (!search) return;

        this.logEvent('failed', 'data-match-search', 'Data Match search', {
            ...search.selection,
            searchId,
            errorCategory: error instanceof Error ? error.name : 'Error',
            errorMessage: error instanceof Error ? error.message : String(error),
        });
        this.searches.delete(searchId);
    }

    // Link the next result batch to the learner's More click.
    moreDataMatchesClicked(searchId: string): void {
        const search = this.searches.get(searchId);
        if (!search) return;

        search.moreEventId =
            this.logEvent('clicked', 'more-data-matches', 'More Data Match results', {
                ...search.selection,
                searchId,
                previouslyDisplayed: search.totalDisplayed,
            }) ?? undefined;
    }

    // Append a displayed batch without repeating the initial search results.
    moreDataMatchesDisplayed(searchId: string, results: PrettyResult[]): void {
        const search = this.searches.get(searchId);
        if (!search?.moreEventId || !search.statistics) return;

        const addedResults = this.matchResults(results, search.totalDisplayed);
        search.totalDisplayed += addedResults.length;

        this.logEvent('displayed', 'more-data-matches', 'Additional Data Match results', {
            ...search.selection,
            searchId,
            triggeringEventId: search.moreEventId,
            statistics: search.statistics,
            addedResults,
            addedCount: addedResults.length,
            totalDisplayed: search.totalDisplayed,
        });
        search.moreEventId = undefined;
    }

    // Record a new chat within the current inquiry.
    newChatStarted(): string | null {
        return this.logEvent('started', 'new-chat', 'New chat');
    }
}

// Access the shared logger; the integration hook will call this.
export function getLogger(): Promise<Logger | null> {
    return Logger.get();
}
