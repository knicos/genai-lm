import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createStore } from 'jotai';
import { MemoryRouter } from 'react-router-dom';
import TestWrapper from '../../utilities/TestWrapper';
import DataBox from './DataBox';
import { dataTokens } from '../../state/data';
import { TokenStore } from '@genai-fi/nanogpt';

function renderDataBox(inferenceMode = false, tokenCount = 0) {
    const store = createStore();
    store.set(dataTokens, {
        tokens: {
            getTokenCount: () => tokenCount,
        } as TokenStore,
        tokeniserId: 'tok',
        datasetId: 'data',
    });

    return render(
        <MemoryRouter>
            <TestWrapper initializeState={store}>
                <DataBox inferenceMode={inferenceMode} />
            </TestWrapper>
        </MemoryRouter>
    );
}

describe('DataBox', () => {
    it('renders data label', ({ expect }) => {
        renderDataBox(false, 5);
        expect(screen.getByText(/tools.data/)).toBeInTheDocument();
    });

    it('shows unused label in inference mode', ({ expect }) => {
        renderDataBox(true, 5);
        expect(screen.getByText(/tools.dataUnused/)).toBeInTheDocument();
    });

    it('renders navigation link icon', ({ expect }) => {
        const { container } = renderDataBox();
        expect(container.querySelector('a')).toBeInTheDocument();
    });
});
