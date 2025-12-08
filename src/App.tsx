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
import { Component as Home } from './views/Home';

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

    logger.error({
        errorString: str,
        userAgent: navigator.userAgent,
        url: window.location.href,
    });

    console.error(error);

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
            element={<Home />}
        />

        <Route
            path="workspace"
            element={
                <Navigate
                    replace
                    to="/workspace/pretrain"
                />
            }
        />

        <Route
            path="workspace/:flow"
            lazy={() => import('./views/Workspace')}
        >
            <Route
                path="generator-settings"
                lazy={() => import('./views/GeneratorSettings')}
            />
            <Route
                path="training-settings"
                lazy={() => import('./views/TrainingSettings')}
            />
            <Route
                path="checks"
                lazy={() => import('./views/Checks')}
            />
            <Route
                path="debug-model"
                lazy={() => import('./views/ModelDebug')}
            />
            <Route
                path="training-process"
                lazy={() => import('./views/TrainingProcess')}
            />
            <Route
                path="training-log"
                lazy={() => import('./views/TrainingLog')}
            />
        </Route>
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
