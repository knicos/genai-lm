import { describe, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Generator } from '@genai-fi/nanogpt';
import { createStore } from 'jotai';
import TestWrapper from '../../utilities/TestWrapper';
import ChatOutput from './ChatOutput';
import { generatorAtom } from '../../state/generator';
import { BrowserRouter } from 'react-router-dom';

describe('ChatOutput', () => {
    it('renders without a model', async ({ expect }) => {
        render(
            <BrowserRouter>
                <ChatOutput />
            </BrowserRouter>
        );
        expect(screen.getByText('generator.title')).toBeInTheDocument();
    });

    it('displays a generator conversation', async ({ expect }) => {
        const mockGenerator = {
            on: () => {},
            off: () => {},
            dispose: () => {},
            getConversation: vi.fn(() => [{ role: 'user', content: 'Hello world' }]),
        } as unknown as Generator;

        const store = createStore();

        store.set(generatorAtom, mockGenerator);

        render(
            <BrowserRouter>
                <TestWrapper initializeState={store}>
                    <ChatOutput />
                </TestWrapper>
            </BrowserRouter>
        );

        expect(mockGenerator.getConversation).toHaveBeenCalled();
        expect(screen.getByText('Hello world')).toBeInTheDocument();
    });
});
