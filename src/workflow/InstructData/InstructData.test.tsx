import { describe, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import renderWithContexts from '../../utilities/renderWithContexts';
import InstructData from './InstructData';
import { createStore } from 'jotai';
import { conversationDataAtom } from '../../state/data';

vi.mock('file-saver', () => ({ saveAs: vi.fn() }));
vi.mock('../../state/storage');

describe('InstructData workflow', () => {
    it('renders', async ({ expect }) => {
        const store = createStore();
        store.set(conversationDataAtom, [[{ role: 'user', content: 'Hello world' }]]);
        renderWithContexts(<InstructData />, { withWorkflow: true, store });
        expect(await screen.findByTestId('conversation-row-0')).toBeInTheDocument();
    });
});
