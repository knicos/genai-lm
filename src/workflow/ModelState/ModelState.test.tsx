import { render, screen } from '@testing-library/react';
import { createStore } from 'jotai';
import { describe, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { WorkflowLayout } from '@genai-fi/base';
import TestWrapper from '../../utilities/TestWrapper';
import { modelAtom, modelDownloadAtom } from '../../state/model';
import ModelState from './ModelState';

type ModelStatus = 'none' | 'loading' | 'training' | 'busy' | 'warmup' | 'error' | 'ready' | 'awaitingTokens';
type ModelEvent = 'status' | 'mode' | 'loaded' | 'error' | 'changeLoRA';
type ModelMode = 'untrained' | 'completion' | 'conversational';

interface FakeModelOptions {
    name: string;
    status?: ModelStatus;
    busy?: boolean;
    loaded?: boolean;
    mode?: ModelMode;
    hasLoRA?: boolean;
}

function createFakeModel(options: FakeModelOptions) {
    const listeners: Partial<Record<ModelEvent, Set<(...args: unknown[]) => void>>> = {};

    const on = vi.fn((event: ModelEvent, cb: (...args: unknown[]) => void) => {
        if (!listeners[event]) listeners[event] = new Set();
        listeners[event]?.add(cb);
    });

    const off = vi.fn((event: ModelEvent, cb: (...args: unknown[]) => void) => {
        listeners[event]?.delete(cb);
    });

    return {
        status: options.status ?? 'ready',
        busy: options.busy ?? false,
        loaded: options.loaded ?? true,
        mode: options.mode ?? 'untrained',
        meta: { name: options.name },
        on,
        off,
        hasLoRA: vi.fn(() => options.hasLoRA ?? false),
        saveModel: vi.fn().mockResolvedValue(new Blob(['x'])),
        dispose: vi.fn(),
    };
}

function renderModelState(options?: {
    modelName?: string;
    status?: ModelStatus;
    downloading?: boolean;
    busy?: boolean;
    loaded?: boolean;
    mode?: ModelMode;
    hasLoRA?: boolean;
}) {
    const store = createStore();

    if (options?.modelName) {
        store.set(
            modelAtom,
            createFakeModel({
                name: options.modelName,
                status: options.status,
                busy: options.busy,
                loaded: options.loaded,
                mode: options.mode,
                hasLoRA: options.hasLoRA,
            }) as never
        );
    } else {
        store.set(modelAtom, null);
    }

    store.set(modelDownloadAtom, options?.downloading ? ({} as never) : null);

    render(
        <TestWrapper initializeState={store}>
            <MemoryRouter initialEntries={['/workspace/default/model']}>
                <WorkflowLayout connections={[]}>
                    <ModelState />
                </WorkflowLayout>
            </MemoryRouter>
        </TestWrapper>
    );
}

describe('ModelState workflow', () => {
    it('shows no-model state when model is missing', ({ expect }) => {
        renderModelState();
        expect(screen.getByText('model.noModel')).toBeInTheDocument();
    });

    it('shows model name metadata when a model is available', ({ expect }) => {
        renderModelState({ modelName: 'Classroom GPT', status: 'ready' });
        expect(screen.getByDisplayValue('Classroom GPT')).toBeInTheDocument();
    });

    it('renders untrained stage as one completed checkpoint', ({ expect }) => {
        renderModelState({ modelName: 'Model U', status: 'ready', loaded: true, mode: 'untrained' });
        expect(screen.getAllByTestId('TaskAltIcon')).toHaveLength(1);
    });

    it('renders pretrained stage as two completed checkpoints', ({ expect }) => {
        renderModelState({ modelName: 'Model P', status: 'ready', loaded: true, mode: 'completion' });
        expect(screen.getAllByTestId('TaskAltIcon')).toHaveLength(2);
    });

    it('renders finetuned stage as three completed checkpoints', ({ expect }) => {
        renderModelState({ modelName: 'Model F', status: 'ready', loaded: true, mode: 'conversational' });
        expect(screen.getAllByTestId('TaskAltIcon')).toHaveLength(3);
    });

    it('renders LoRA stage as four completed checkpoints', ({ expect }) => {
        renderModelState({
            modelName: 'Model L',
            status: 'ready',
            loaded: true,
            mode: 'conversational',
            hasLoRA: true,
        });
        expect(screen.getAllByTestId('TaskAltIcon')).toHaveLength(4);
    });

    it('shows loading state', ({ expect }) => {
        renderModelState({ modelName: 'Model A', status: 'loading' });
        expect(screen.getByText('model.loading')).toBeInTheDocument();
    });

    it('shows training state', ({ expect }) => {
        renderModelState({ modelName: 'Model B', status: 'training' });
        expect(screen.getByText('model.training')).toBeInTheDocument();
    });

    it('shows busy state for busy status', ({ expect }) => {
        renderModelState({ modelName: 'Model C', status: 'busy', busy: true });
        expect(screen.getByText('model.busy')).toBeInTheDocument();
    });

    it('shows busy state for warmup status', ({ expect }) => {
        renderModelState({ modelName: 'Model C', status: 'warmup', busy: true });
        expect(screen.getByText('model.busy')).toBeInTheDocument();
    });

    it('shows error state', ({ expect }) => {
        renderModelState({ modelName: 'Model D', status: 'error' });
        expect(screen.getByText('model.error')).toBeInTheDocument();
    });

    it('shows download state when downloader exists', ({ expect }) => {
        renderModelState({ modelName: 'Model E', status: 'loading', downloading: true });
        expect(screen.getByText('model.downloading')).toBeInTheDocument();
    });

    it('hides transient status messages when model is ready', ({ expect }) => {
        renderModelState({ modelName: 'Model R', status: 'ready' });
        expect(screen.queryByText('model.loading')).not.toBeInTheDocument();
        expect(screen.queryByText('model.training')).not.toBeInTheDocument();
        expect(screen.queryByText('model.busy')).not.toBeInTheDocument();
        expect(screen.queryByText('model.error')).not.toBeInTheDocument();
        expect(screen.queryByText('model.noModel')).not.toBeInTheDocument();
    });
});
