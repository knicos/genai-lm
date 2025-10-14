import React from 'react';
import {
    RouterProvider,
    Route,
    createBrowserRouter,
    createRoutesFromElements,
    useRouteError,
    Navigate,
} from 'react-router-dom';
import { Provider } from 'jotai';
import './App.css';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import { theme } from '@genai-fi/base';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import logger from './utilities/logger';

interface RouterError {
    status: number;
}

function ErrorComponent() {
    const error = useRouteError();

    if ((error as RouterError).status === 404) {
        return (
            <section className="errorView">
                <h1>Page not found</h1>
            </section>
        );
    }

    const json = JSON.stringify(error);
    const str = json === '{}' && 'toString' in (error as Error) ? (error as Error).toString() : 'Unknown';

    logger.error(`Router error: ${str}`);

    return (
        <section className="errorView">
            <h1>Something went wrong</h1>
            <p>
                Please report this issue to{' '}
                <a
                    href="https://github.com/knicos/genai-/issues"
                    target="_blank"
                    rel="noreferrer"
                >
                    our project on github
                </a>{' '}
                if you have time, including the information below. Refresh the page to try again.
            </p>
            <p className="code">{str}</p>
        </section>
    );
}

export const routes = createRoutesFromElements(
    <Route
        path="/"
        ErrorBoundary={ErrorComponent}
    >
        <Route
            index
            element={
                <Navigate
                    replace
                    to="/workspace"
                />
            }
        />

        <Route
            path="workspace"
            lazy={() => import('./views/Workspace')}
        />
    </Route>
);
const defaultRouter = createBrowserRouter(routes);

interface Props {
    router?: typeof defaultRouter;
}

function App({ router }: Props) {
    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme}>
                <Provider>
                    <DndProvider backend={HTML5Backend}>
                        <React.Suspense fallback={'...'}>
                            <RouterProvider router={router || defaultRouter} />
                        </React.Suspense>
                    </DndProvider>
                </Provider>
            </ThemeProvider>
        </StyledEngineProvider>
    );
}

export default App;
