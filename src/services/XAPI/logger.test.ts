import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import type { GeneratorConversation, IGeneratorResponse, TeachableLLM } from '@genai-fi/nanogpt';
import type { Statement } from '@xapi/xapi';
import type { PrettyResult } from '../../utilities/search/prettyResult';

const namespace = 'https://lm.gen-ai.fi/xapi';
const selection = { selectionId: 'selection', outputId: 'output', selectedText: 'fox', startToken: 0, endToken: 0 };

beforeEach(async () => {
    vi.resetModules();
    vi.doMock('./delivery', async (importOriginal) => {
        const original = await importOriginal<typeof import('./delivery')>();
        return { ...original, flushQueue: vi.fn().mockResolvedValue(undefined) };
    });
    sessionStorage.clear();
    localStorage.clear();
    sessionStorage.setItem('llm-xapi-identity-v1:study', '547');
    window.history.replaceState({}, '', '/?log=study');
    vi.spyOn(console, 'info').mockImplementation(() => {});
});
afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock('./delivery');
});

function fakeModel() {
    const responses = new EventEmitter();
    const beaming = new EventEmitter();
    const records = new Map<string, IGeneratorResponse>();
    const model = {
        meta: { id: 'stories', name: 'Stories' },
        responses: Object.assign(responses, {
            getResponse: (id: string) => records.get(id) ?? null,
        }),
        beaming,
    } as unknown as TeachableLLM;
    const complete = (id: string, content: string) => {
        const output = [{ role: 'text', content, _output: [{ text: content, token: 1 }] }] as GeneratorConversation[];
        records.set(id, { id, done: true, output });
        responses.emit('done', id);
        return output;
    };
    return { model, responses, beaming, records, complete };
}

async function setup() {
    const service = await import('./logger');
    const logger = await service.getLogger();
    if (!logger) throw new Error('Expected logger');
    const delivery = await import('./delivery');
    const source = fakeModel();
    logger.setAuditActive(true);
    logger.setModel(source.model);
    const statements = () => delivery.getRecording().queue.map((entry) => entry.statement);
    return { ...source, logger, statements, service };
}
function details(statement: Statement) {
    return statement.result?.extensions?.[`${namespace}/extensions/details`];
}
function events(statements: Statement[], verb: string, activity: string) {
    return statements.filter(
        (statement) =>
            statement.verb.id === `${namespace}/verbs/${verb}` &&
            'id' in statement.object &&
            statement.object.id === `${namespace}/activities/${activity}`
    );
}

describe('model-observing logger service', () => {
    it('shares one instance, exposes the participant, and ignores events outside audit', async () => {
        const { logger, service, responses, statements } = await setup();
        expect(await service.getLogger()).toBe(logger);
        expect(logger.participantNumber).toBe(547);
        const count = statements().length;
        logger.setAuditActive(false);
        logger.promptSubmitted('Ignored');
        logger.alternativesToolClicked();
        responses.emit('generating', 'outside');
        expect(statements()).toHaveLength(count);
    });

    it('observes generation and saves full output once with capture sequence and no model metadata', async () => {
        const { logger, responses, complete, statements } = await setup();
        const trigger = logger.promptSubmitted('Once upon a time', { temperature: 0.8 });
        responses.emit('generating', 'response');
        complete('response', 'Once upon a time, a fox went home.');
        responses.emit('done', 'response');
        const starts = events(statements(), 'started', 'generation');
        const finished = events(statements(), 'completed', 'generation');
        expect(finished).toHaveLength(1);
        expect(finished[0].result?.response).toBe('Once upon a time, a fox went home.');
        expect(details(starts[0])).toMatchObject({ triggeringEventId: trigger });
        for (const event of statements()) {
            expect(details(event)).not.toHaveProperty('model');
            expect(JSON.stringify(event)).not.toContain('Stories');
        }
        expect(events(statements(), 'changed', 'model')).toHaveLength(0);
        expect(statements().map((event) => event.context?.extensions?.[`${namespace}/extensions/sequence`])).toEqual([
            1, 2, 3, 4,
        ]);
        expect(new Set(statements().map((event) => event.id)).size).toBe(4);
        expect(statements()[0].actor).toMatchObject({ account: { name: 'study-547' } });
    });

    it('binds different start/done IDs for a continuation and records explicit stops', async () => {
        const { logger, responses, complete, statements } = await setup();
        logger.promptSubmitted('Continue');
        responses.emit('generating', 'previous-response');
        logger.generationCreated('new-response', 'previous-response');
        logger.generationStopRequested('new-response');
        complete('new-response', 'Partial story');
        expect(events(statements(), 'completed', 'generation')).toHaveLength(0);
        expect(events(statements(), 'stopped', 'generation')[0].result?.response).toBe('Partial story');
    });

    it('handles completion before the continuation response is bound', async () => {
        const { logger, responses, complete, statements } = await setup();
        logger.promptSubmitted('Continue');
        responses.emit('generating', 'previous');
        complete('new', 'Story');
        logger.generationCreated('new', 'previous');
        expect(events(statements(), 'completed', 'generation')).toHaveLength(1);
    });

    it('observes beams and More batches, links selection to the revised output', async () => {
        const { logger, responses, beaming, complete, statements } = await setup();
        logger.promptSubmitted('Story');
        responses.emit('generating', 'first');
        const output = complete('first', 'fox');
        const context = logger.selectionContext(output, { conversationIndex: 0, startToken: 0, endToken: 0 });
        if (!context) throw new Error('Missing output context');
        logger.watchBeams('beam', output, { conversationIndex: 0, startToken: 0, endToken: 0 });
        const first = [{ text: 'rabbit', score: 0.5 }];
        beaming.emit('progress', 'beam', first);
        beaming.emit('done', 'beam', first);
        expect(events(statements(), 'displayed', 'alternatives')).toHaveLength(1);
        logger.beamMore('beam');
        beaming.emit('progress', 'beam', [{ text: 'dog', score: 0.3 }]);
        beaming.emit('done', 'beam', [{ text: 'dog', score: 0.3 }]);
        expect(details(events(statements(), 'displayed', 'more-alternatives')[0])).toMatchObject({
            addedOptions: [{ text: 'dog', position: 2, score: 0.3 }],
            totalDisplayed: 2,
        });
        const selected = logger.beamSelect('beam', 'dog', 2, { temperature: 0.8 });
        responses.emit('generating', 'second');
        complete('second', 'dog went home');
        expect(events(statements(), 'submitted', 'prompt')).toHaveLength(1);
        expect(details(events(statements(), 'started', 'generation')[1])).toMatchObject({
            trigger: 'alternative',
            triggeringEventId: selected,
            sourceOutputId: context.outputId,
            settings: { temperature: 0.8, continuation: true, background: true },
        });
        expect(events(statements(), 'completed', 'generation')[1].result?.response).toBe('dog went home');
    });

    it('ignores untracked beam selections and records a generation request that returns no ID', async () => {
        const { logger, statements } = await setup();
        const before = statements().length;
        logger.watchBeams('untracked', [], { conversationIndex: 0, startToken: 0, endToken: 0 });
        expect(logger.beamSelect(null, 'fox', 1)).toBeNull();
        expect(logger.beamSelect('untracked', 'fox', 1)).toBeNull();
        expect(statements()).toHaveLength(before);

        logger.promptSubmitted('Story');
        logger.generationRequestFailed();
        expect(events(statements(), 'started', 'generation')).toHaveLength(0);
        expect(events(statements(), 'failed', 'generation')).toHaveLength(1);
        expect(details(events(statements(), 'failed', 'generation')[0])).toMatchObject({
            errorMessage: 'Generation did not start.',
        });
    });

    it('detaches its own listeners on model switch and workspace cleanup without touching other listeners', async () => {
        const { logger, model, responses, beaming, statements } = await setup();
        const other = vi.fn();
        responses.on('done', other);
        logger.setModel(model);
        expect(responses.listenerCount('generating')).toBe(1);
        const next = fakeModel();
        logger.setModel(next.model);
        expect(responses.listenerCount('generating')).toBe(0);
        expect(responses.listenerCount('done')).toBe(1);
        expect(beaming.listenerCount('progress')).toBe(0);
        const count = statements().length;
        logger.setModel(null);
        logger.setAuditActive(false);
        next.responses.emit('generating', 'ignored');
        logger.newChatStarted();
        expect(statements()).toHaveLength(count);
        expect(next.responses.listenerCount('done')).toBe(0);
        expect(next.beaming.listenerCount('done')).toBe(0);
    });

    it('records reported generation failure with partial output', async () => {
        const { logger, responses, records, statements } = await setup();
        logger.promptSubmitted('Story');
        responses.emit('generating', 'failed');
        records.set('failed', { id: 'failed', done: false, output: [{ role: 'text', content: 'Partial' }] });
        responses.emit('error', new Error('Generation unavailable'));
        expect(details(events(statements(), 'failed', 'generation')[0])).toMatchObject({
            text: 'Partial',
            errorMessage: 'Generation unavailable',
        });
    });

    it('prepares search text and counts, assigns match IDs and links More inside the service', async () => {
        const { logger, statements } = await setup();
        const searchId = logger.dataMatchRequested(selection, [{ text: 'a ' }, { text: 'fox' }]);
        if (!searchId) throw new Error('Missing search');
        const result = {
            text: 'fox',
            prefixFragments: [{ text: 'A ' }],
            suffixFragments: [{ text: ' ran.' }],
        } as PrettyResult;
        logger.dataMatchResultsDisplayed(
            searchId,
            { estimatedMatches: 10, exactMatches: 1, results: [result, result, result] },
            [result]
        );
        expect(details(events(statements(), 'requested', 'data-match-search')[0])).toMatchObject({
            ...selection,
            searchId,
            searchText: 'a fox',
        });
        expect(details(events(statements(), 'displayed', 'data-match-results')[0])).toMatchObject({
            searchId,
            statistics: { approximateExactMatches: 10, partialMatches: 2 },
            totalDisplayed: 1,
            results: [{ resultId: expect.any(String), position: 1, excerpt: 'A fox ran.' }],
        });
        logger.moreDataMatchesClicked(searchId);
        logger.moreDataMatchesDisplayed(searchId, [result]);
        logger.moreDataMatchesDisplayed(searchId, [result]);
        const more = events(statements(), 'displayed', 'more-data-matches');
        expect(more).toHaveLength(1);
        expect(details(more[0])).toMatchObject({
            searchId,
            statistics: { approximateExactMatches: 10, partialMatches: 2 },
            totalDisplayed: 2,
            addedCount: 1,
            addedResults: [{ resultId: expect.any(String), position: 2, excerpt: 'A fox ran.' }],
            triggeringEventId: events(statements(), 'clicked', 'more-data-matches')[0].id,
        });
    });

    it('retains zero matches as success, search errors as failures, and new chat in the same recording', async () => {
        const { logger, statements } = await setup();
        const searchId = logger.dataMatchRequested(selection, [{ text: 'a fox' }]);
        const failedSearchId = logger.dataMatchRequested(selection, [{ text: 'other text' }]);
        if (!searchId || !failedSearchId) throw new Error('Missing search identifiers');
        logger.dataMatchResultsDisplayed(searchId, { estimatedMatches: 0, exactMatches: 0, results: [] }, []);
        logger.dataMatchFailed(failedSearchId, new Error('Unavailable'));
        logger.newChatStarted();
        expect(events(statements(), 'displayed', 'data-match-results')).toHaveLength(1);
        expect(events(statements(), 'failed', 'data-match-search')).toHaveLength(1);
        expect(events(statements(), 'started', 'new-chat')).toHaveLength(1);
        expect(new Set(statements().map((event) => event.context?.registration)).size).toBe(1);
    });

    it('links preparation failures to the original selection and ignores missing selection context', async () => {
        const { logger, statements } = await setup();
        const failure = new Error('Preparation unavailable');
        const before = statements().length;
        expect(logger.dataMatchRequested(null, [{ text: 'fox' }])).toBeNull();
        logger.dataMatchPreparationFailed(undefined, failure);
        expect(statements()).toHaveLength(before);

        logger.dataMatchPreparationFailed(selection, failure);
        const requested = events(statements(), 'requested', 'data-match-search')[0];
        const requestDetails = details(requested) as { searchId: string };
        expect(details(requested)).toMatchObject({ ...selection, searchText: selection.selectedText });
        expect(details(events(statements(), 'failed', 'data-match-search')[0])).toMatchObject({
            ...selection,
            searchId: requestDetails.searchId,
            errorMessage: failure.message,
        });
    });
});
