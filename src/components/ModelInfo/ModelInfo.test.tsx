import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ModelInfo from './ModelInfo';

describe('ModelInfo', () => {
    it('renders', async ({ expect }) => {
        render(
            <ModelInfo
                config={{ nLayer: 12 }}
                tokeniser="char"
                showLayers
                showTokens
            />
        );

        expect(screen.getByText('model.layers')).toBeVisible();
        expect(screen.getByText('model.charTokeniser')).toBeVisible();
    });
});
