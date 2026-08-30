import { Suspense } from 'react';
import { RouterProvider, Route, createBrowserRouter, createRoutesFromElements, Navigate } from 'react-router';
import { Provider } from 'jotai';
import './App.css';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import { theme } from '@genai-fi/base';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { store } from './state/store';
import About from './views/About/About';
import ErrorComponent from './components/ErrorComponent/ErrorComponent';

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
                    to="/workspace/home"
                />
            }
        />
        <Route
            path="/error"
            element={<ErrorComponent />}
        />
        <Route
            path="about"
            element={<About />}
        />

        <Route
            path="workspace"
            element={
                <Navigate
                    replace
                    to="/workspace/home"
                />
            }
        />

        <Route
            path="app/:code"
            lazy={() => import('./views/ChatApp')}
        />

        <Route
            path="workspace/:flow"
            lazy={() => import('./views/Workspace')}
        />

        <Route
            path="workspace/:variant/:flow"
            lazy={() => import('./views/Workspace')}
        >
            <Route
                path="generator-settings"
                lazy={() => import('./views/GeneratorSettings')}
            />
            <Route
                path="tokenise-settings"
                lazy={() => import('./views/TokeniseSettings')}
            />
            <Route
                path="training-settings"
                lazy={() => import('./views/TrainingSettings')}
            />
            <Route
                path="arch-settings"
                lazy={() => import('./views/ArchSettings')}
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
                path="inference-process"
                lazy={() => import('./views/InferenceProcess')}
            />
            <Route
                path="training-log"
                lazy={() => import('./views/TrainingLog')}
            />
            <Route
                path="tune-log"
                lazy={() => import('./views/TuneLog')}
            />
            <Route
                path="gradients"
                lazy={() => import('./views/Gradients')}
            />
            <Route
                path="auto-tune"
                lazy={() => import('./views/AutoTune')}
            />
            <Route
                path="vocabulary"
                lazy={() => import('./views/Vocabulary')}
            />
            <Route
                path="tokenised-data"
                lazy={() => import('./views/TokenisedData')}
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
                <Provider store={store}>
                    <DndProvider backend={HTML5Backend}>
                        <Suspense fallback={'...'}>
                            <RouterProvider router={router || defaultRouter} />
                        </Suspense>
                    </DndProvider>
                </Provider>
            </ThemeProvider>
        </StyledEngineProvider>
    );
}

export default App;
