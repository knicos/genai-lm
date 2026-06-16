import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import StatusBox from './StatusBox';

describe('StatusBox', () => {
    it('renders', ({ expect }) => {
        render(<StatusBox status="info" />);
        expect(document.body).toBeInTheDocument();
    });
});
