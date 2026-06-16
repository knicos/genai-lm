import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import InfoPop from './InfoPop';

describe('InfoPop', () => {
    it('renders closed', ({ expect }) => {
        render(
            <InfoPop open={false}>
                <div>info</div>
            </InfoPop>
        );
        expect(document.body).toBeInTheDocument();
    });
});
