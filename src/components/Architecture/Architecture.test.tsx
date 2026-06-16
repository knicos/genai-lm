import { createRef } from 'react';
import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import TestWrapper from '../../utilities/TestWrapper';
import Architecture, { ArchitectureRef } from './Architecture';

describe('Architecture', () => {
    it('renders', ({ expect }) => {
        render(<Architecture ref={createRef<ArchitectureRef>()} />, { wrapper: TestWrapper });
        expect(document.body).toBeInTheDocument();
    });
});
