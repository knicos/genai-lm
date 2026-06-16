import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import ModelSearch from './ModelSearch';

describe('ModelSearch', () => {
    it('renders', ({ expect }) => {
        render(
            <ModelSearch
                onClose={() => {}}
                dataRows={[]}
                langs={[]}
                setLang={() => {}}
                lang="en-GB"
            />
        );
        expect(document.body).toBeInTheDocument();
    });
});
