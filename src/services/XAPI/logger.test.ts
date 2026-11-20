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
        logger.watchBeams('beam', context);
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
        const selected = logger.beamSelect('beam', 'dog', 2);
        responses.emit('generating', 'second');
        complete('second', 'dog went home');
        expect(events(statements(), 'submitted', 'prompt')).toHaveLength(1);
        expect(details(events(statements(), 'started', 'generation')[1])).toMatchObject({
            trigger: 'alternative',
            triggeringEventId: selected,
            sourceOutputId: context.outputId,
        });
        expect(events(statements(), 'completed', 'generation')[1].result?.response).toBe('dog went home');
    });

    it('detaches its own listeners on model switch and dispose without touching other listeners', async () => {
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
        logger.dispose();
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

    it('assigns match IDs and links More results inside the service', async () => {
        const { logger, statements } = await setup();
        const searchId = logger.dataMatchRequested(selection, 'a fox');
        if (!searchId) throw new Error('Missing search');
        const result = {
            text: 'fox',
            prefixFragments: [{ text: 'A ' }],
            suffixFragments: [{ text: ' ran.' }],
        } as PrettyResult;
        logger.dataMatchResultsDisplayed(searchId, { approximateExactMatches: 10, partialMatches: 2 }, [result]);
        logger.moreDataMatchesClicked(searchId);
        logger.moreDataMatchesDisplayed(searchId, [result]);
        logger.moreDataMatchesDisplayed(searchId, [result]);
        const more = events(statements(), 'displayed', 'more-data-matches');
        expect(more).toHaveLength(1);
        expect(details(more[0])).toMatchObject({
            searchId,
            totalDisplayed: 2,
            addedCount: 1,
            addedResults: [{ resultId: expect.any(String), position: 2, excerpt: 'A fox ran.' }],
            triggeringEventId: events(statements(), 'clicked', 'more-data-matches')[0].id,
        });
    });

    it('retains zero matches as success, search errors as failures, and new chat in the same recording', async () => {
        const { logger, statements } = await setup();
        const searchId = logger.dataMatchRequested(selection, 'a fox');
        const failedSearchId = logger.dataMatchRequested(selection, 'other text');
        if (!searchId || !failedSearchId) throw new Error('Missing search identifiers');
        logger.dataMatchResultsDisplayed(searchId, { approximateExactMatches: 0, partialMatches: 0 }, []);
        logger.dataMatchFailed(failedSearchId, new Error('Unavailable'));
        logger.newChatStarted();
        expect(events(statements(), 'displayed', 'data-match-results')).toHaveLength(1);
        expect(events(statements(), 'failed', 'data-match-search')).toHaveLength(1);
        expect(events(statements(), 'started', 'new-chat')).toHaveLength(1);
        expect(new Set(statements().map((event) => event.context?.registration)).size).toBe(1);
    });
});
