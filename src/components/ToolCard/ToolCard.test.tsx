import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import ToolCard from './ToolCard';

describe('ToolCard', () => {
    it('renders', ({ expect }) => {
        render(
            <ToolCard
                onSelect={() => {}}
                onHighlight={() => {}}
                card={{ id: 'tool', name: 'tool.name', icon: 'settings' }}
            />
        );
        expect(document.body).toBeInTheDocument();
    });
});
