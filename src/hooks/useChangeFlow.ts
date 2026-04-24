import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export default function useChangeFlow() {
    const navigate = useNavigate();

    return useCallback(
        (flow: string) => {
            const path = window.location.pathname.split('/');
            const ending = path[3];
            navigate(ending ? `/workspace/${flow}/${ending}` : `/workspace/${flow}`, { replace: true });
        },
        [navigate]
    );
}
