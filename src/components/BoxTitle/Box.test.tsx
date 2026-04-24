import { render, screen } from '@testing-library/react';
import { describe, it } from 'vitest';
import Box from './Box';
import BoxTitle from './BoxTitle';
import { WorkflowLayout } from '@genai-fi/base';

describe('Box', () => {
    it('renders with done status', async ({ expect }) => {
        render(
            <WorkflowLayout connections={[]}>
                <Box>
                    <BoxTitle
                        title="Title"
                        status={'done'}
                    />
                    Test
                </Box>
            </WorkflowLayout>
        );
        expect(screen.getByText('Test')).toBeInTheDocument();
        expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('renders with busy status', async ({ expect }) => {
        render(
            <WorkflowLayout connections={[]}>
                <Box>
                    <BoxTitle
                        title="Title"
                        status={'busy'}
                    />
                    Test
                </Box>
            </WorkflowLayout>
        );
        expect(screen.getByText('Test')).toBeInTheDocument();
        expect(screen.getByText('Title')).toBeInTheDocument();
    });
});
