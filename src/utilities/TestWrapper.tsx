import React from 'react';
//import { BrowserRouter } from 'react-router-dom';
import { createStore, Provider } from 'jotai';

interface Props extends React.PropsWithChildren {
    initializeState?: ReturnType<typeof createStore>;
}

export default function TestWrapper({ initializeState, children }: Props) {
    return <Provider store={initializeState}>{children}</Provider>;
}
