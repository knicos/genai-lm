import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Generator } from '@genai-fi/nanogpt';
import { createStore } from 'jotai';
import TestWrapper from '../../utilities/TestWrapper';
import RawGeneration from './RawGeneration';
import { rawGeneratorAtom } from '../../state/generator';
import { BrowserRouter } from 'react-router-dom';
import { WorkflowLayout } from '@genai-fi/base';

describe('RawGeneration', () => {
    it('renders without a model', async ({ expect }) => {
        render(
            <BrowserRouter>
                <WorkflowLayout connections={[]}>
                    <RawGeneration />
                </WorkflowLayout>
            </BrowserRouter>
        );
        expect(screen.getByTestId('chat-output')).toBeInTheDocument();
    });

    it('displays a generator conversation', async ({ expect }) => {
        const mockGenerator = {
            on: () => {},
            off: () => {},
            dispose: () => {},
            getConversation: vi.fn(() => [{ role: 'user', content: 'Hello world' }]),
        } as unknown as Generator;

        const store = createStore();

        store.set(rawGeneratorAtom, mockGenerator);

        render(
            <BrowserRouter>
                <TestWrapper initializeState={store}>
                    <WorkflowLayout connections={[]}>
                        <RawGeneration />
                    </WorkflowLayout>
                </TestWrapper>
            </BrowserRouter>
        );

        expect(mockGenerator.getConversation).toHaveBeenCalled();
        expect(await screen.findByText('Hello world')).toBeInTheDocument();
    });
});
