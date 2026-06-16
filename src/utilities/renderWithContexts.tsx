import { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WorkflowLayout } from '@genai-fi/base';
import TestWrapper from './TestWrapper';

interface Options {
    route?: string;
    withWorkflow?: boolean;
}

export default function renderWithContexts(ui: ReactElement, options?: Options) {
    const { route = '/workspace/default/model', withWorkflow = false } = options || {};

    if (withWorkflow) {
        return render(
            <TestWrapper>
                <MemoryRouter initialEntries={[route]}>
                    <WorkflowLayout connections={[]}>{ui}</WorkflowLayout>
                </MemoryRouter>
            </TestWrapper>
        );
    }

    return render(
        <TestWrapper>
            <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </TestWrapper>
    );
}
