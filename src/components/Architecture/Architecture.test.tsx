import { createRef } from 'react';
import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import TestWrapper from '../../utilities/TestWrapper';
import Architecture, { ArchitectureRef } from './Architecture';

describe('Architecture', () => {
    it('renders', ({ expect }) => {
        render(
            <Architecture
                ref={createRef<ArchitectureRef>()}
                architecture={{
                    id: 'untrained-small',
                    tokenizer: 'char',
                    vocabSize: 200,
                    nEmbed: 192,
                    nHead: 3,
                    nLayer: 4,
                    mlpFactor: 4,
                    modelType: 'GenAI_NanoGPT_v2',
                    blockSize: 128,
                }}
            />,
            { wrapper: TestWrapper }
        );
        expect(document.body).toBeInTheDocument();
    });
});
