import { useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type FlowType = 'model' | 'pretraindata' | 'pretrain' | 'finetune' | 'deployment' | 'home';

interface ChangePath {
    flow?: FlowType;
    sidepanel?: string | null;
    replace?: boolean;
    preserveSearch?: boolean;
    preserveHash?: boolean;
    query?: Record<string, string>;
}

export function useChangePathString({ flow, sidepanel, preserveSearch, preserveHash, query }: ChangePath) {
    const location = useLocation();
    const locationRef = useRef(location);
    locationRef.current = location;

    return useMemo(() => {
        const { pathname, search, hash } = locationRef.current;

        const segments = pathname.split('/').filter(Boolean);

        if (flow) {
            segments[1] = flow;
        }
        if (sidepanel !== undefined) {
            if (sidepanel === null) {
                segments.splice(2, 1);
            } else if (segments.length < 3) {
                segments.push(sidepanel);
            } else {
                segments[2] = sidepanel;
            }
        }

        let searchString = '';
        if ((preserveSearch ?? true) && !query) {
            searchString = search;
        } else if (query) {
            const params = new URLSearchParams(query);
            if (preserveSearch ?? true) {
                const currentParams = new URLSearchParams(search);
                for (const [key, value] of currentParams.entries()) {
                    if (!params.has(key)) {
                        params.set(key, value);
                    }
                }
            }
            searchString = `?${params.toString()}`;
        }

        return '/' + segments.join('/') + searchString + ((preserveHash ?? true) ? hash : '');
    }, [flow, sidepanel, preserveSearch, preserveHash, query]);
}

export function useChangePath() {
    const navigate = useNavigate();
    const location = useLocation();
    const locationRef = useRef(location);
    locationRef.current = location;

    return useCallback(
        ({ flow, sidepanel, replace, preserveSearch, preserveHash, query }: ChangePath) => {
            const { pathname, search, hash } = locationRef.current;

            const segments = pathname.split('/').filter(Boolean);

            if (flow) {
                segments[1] = flow;
            }
            if (sidepanel !== undefined) {
                if (sidepanel === null) {
                    segments.splice(2, 1);
                } else if (segments.length < 3) {
                    segments.push(sidepanel);
                } else {
                    segments[2] = sidepanel;
                }
            }

            let searchString = '';
            if ((preserveSearch ?? true) && !query) {
                searchString = search;
            } else if (query) {
                const params = new URLSearchParams(query);
                if (preserveSearch ?? true) {
                    const currentParams = new URLSearchParams(search);
                    for (const [key, value] of currentParams.entries()) {
                        if (!params.has(key)) {
                            params.set(key, value);
                        }
                    }
                }
                searchString = `?${params.toString()}`;
            }

            navigate(
                {
                    pathname: '/' + segments.join('/'),
                    search: searchString,
                    hash: (preserveHash ?? true) ? hash : '',
                },
                { replace: replace ?? true }
            );
        },
        [navigate]
    );
}
