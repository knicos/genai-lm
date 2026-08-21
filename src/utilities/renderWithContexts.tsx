import { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { WorkflowLayout } from '@genai-fi/base';
import TestWrapper from './TestWrapper';
import { createStore } from 'jotai';

interface Options {
    route?: string;
    withWorkflow?: boolean;
    store?: ReturnType<typeof createStore>; // Add the store option
}

export default function renderWithContexts(ui: ReactElement, options?: Options) {
    const { route = '/workspace/default/model', withWorkflow = false, store } = options || {};

    if (withWorkflow) {
        return render(
            <TestWrapper initializeState={store}>
                <MemoryRouter initialEntries={[route]}>
                    <WorkflowLayout connections={[]}>{ui}</WorkflowLayout>
                </MemoryRouter>
            </TestWrapper>
        );
    }

    return render(
        <TestWrapper initializeState={store}>
            <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </TestWrapper>
    );
}
