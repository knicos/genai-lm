import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { GeneratorConversation } from '@genai-fi/nanogpt';
import { createStore } from 'jotai';
import TestWrapper from '../../utilities/TestWrapper';
import RawGeneration from './RawGeneration';
import { rawGeneratedTextAtom } from '../../state/generator';
import { BrowserRouter } from 'react-router';
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
        const conversation = [{ role: 'user', content: 'Hello world' }] as GeneratorConversation[];

        const store = createStore();

        store.set(rawGeneratedTextAtom, conversation);

        render(
            <BrowserRouter>
                <TestWrapper initializeState={store}>
                    <WorkflowLayout connections={[]}>
                        <RawGeneration />
                    </WorkflowLayout>
                </TestWrapper>
            </BrowserRouter>
        );

        expect(await screen.findByText('Hello world')).toBeInTheDocument();
    });
});
