import { useEffect, useMemo, useRef, useState } from 'react';
import style from './style.module.css';
import { SidePanel, WorkflowLayout } from '@genai-fi/base';
import AppBar from '../../components/AppBar';
import { useAtom, useAtomValue } from 'jotai';
import SettingsDialog from '../../components/SettingsDialog/SettingsDialog';
import DeviceProbe from '../../components/DeviceProbe/DeviceProbe';
import { deviceDetected, devicePerformProbe } from '../../state/device';
import { Outlet, useLocation, useOutlet, useParams } from 'react-router-dom';
import logger from '../../utilities/logger';
import { uiShowSidePanel } from '../../state/uiState';
import useOrientation from '../../hooks/useOrientation';
import ModelState from '../../workflow/ModelState/ModelState';
import Initialiser from './Initialiser';
import PeerShareWrap from '../../components/PeerShare/PeerShareWrap';
import Home from './Home';
import { CONNECTIONS } from './connections';
import { darkTheme } from '@genai-fi/base';
import { ThemeProvider } from '@mui/material';
import { FlowType, useChangePath } from '../../hooks/useChangePath';
import DeploymentFrame from './stages/DeploymentFrame';
import FinetuneFrame from './stages/FinetuneFrame';
import PretrainFrame from './stages/PretrainFrame';
import DataFrame from './stages/DataFrame';
import ModelFrame from './stages/ModelFrame';
import { workflowSteps } from '../../state/workflowSettings';

export function Component() {
    const detected = useAtomValue(deviceDetected);
    const performProbe = useAtomValue(devicePerformProbe);
    const { flow } = useParams() as { flow: FlowType };
    const [sidePanelOpen, setSidePanelOpen] = useAtom(uiShowSidePanel);
    const location = useLocation();
    const outlet = useOutlet();
    const changeFlow = useChangePath();
    const orientation = useOrientation();
    const routeToScrollLock = useRef<FlowType | null>(flow);
    const visibleFlow = useRef<FlowType | null>(null);
    const intersectionObserver = useRef<IntersectionObserver | null>(null);
    const [scrollFrame, setScrollFrame] = useState<FlowType | null>(null);
    const steps = useAtomValue(workflowSteps);

    if (!intersectionObserver.current) {
        intersectionObserver.current = new IntersectionObserver(
            (entries) => {
                const intersecting = entries.filter((e) => e.isIntersecting);

                if (intersecting.length === 1) {
                    const name = intersecting[0].target.id.replace('frame-', '') as FlowType;
                    visibleFlow.current = name;
                    if (routeToScrollLock.current === null) {
                        changeFlow({ flow: name, replace: true, preserveSearch: true });
                    }
                    if (routeToScrollLock.current === name) {
                        routeToScrollLock.current = null;
                    }
                }
            },
            { threshold: 0.55 }
        );
    }

    const hasOutlet = !!outlet;

    useEffect(() => {
        if (hasOutlet) {
            logger.log({ action: 'side_panel_opened', url: location.pathname });
            setSidePanelOpen(true);
        } else {
            logger.log({ action: 'side_panel_closed' });
            setSidePanelOpen(false);
        }
    }, [location.key, hasOutlet, setSidePanelOpen, location.pathname]);

    useEffect(() => {
        if (flow) {
            if (flow === 'home') {
                visibleFlow.current = null;
                setScrollFrame(null);
                return;
            }
            // If frame is visible already then do not scroll again
            if (visibleFlow.current === flow) {
                return;
            }

            routeToScrollLock.current = flow;
            setScrollFrame(flow);
        }
    }, [flow]);

    const connections = useMemo(() => {
        if (steps.has('tokenise')) {
            return CONNECTIONS.filter((c) => !(c.start === 'textData' && c.end === 'trainer'));
        }
        return CONNECTIONS;
    }, [steps]);

    return performProbe && !detected ? (
        <DeviceProbe />
    ) : (
        <>
            <Initialiser />
            <PeerShareWrap />
            <AppBar
                hideTitle
                sidepanel={location.pathname.split('/')[4]}
            />
            <div
                className={style.mainContainer}
                style={{ flexDirection: orientation === 'portrait' ? 'column' : 'row' }}
            >
                <div className={`${style.workspaceContainer} ${flow === 'home' ? style.homeWorkspace : ''}`}>
                    {flow === 'home' && <Home />}
                    {flow !== 'home' && (
                        <WorkflowLayout connections={connections}>
                            <ModelFrame
                                observer={intersectionObserver.current}
                                scrollFrame={scrollFrame || ''}
                            />
                            <DataFrame
                                observer={intersectionObserver.current}
                                scrollFrame={scrollFrame || ''}
                            />
                            <PretrainFrame
                                observer={intersectionObserver.current}
                                scrollFrame={scrollFrame || ''}
                            />
                            <FinetuneFrame
                                observer={intersectionObserver.current}
                                scrollFrame={scrollFrame || ''}
                            />
                            <DeploymentFrame
                                observer={intersectionObserver.current}
                                scrollFrame={scrollFrame || ''}
                            />
                        </WorkflowLayout>
                    )}
                    {flow !== 'home' && (
                        <div className={style.modelOverlay}>
                            <ModelState />
                        </div>
                    )}
                </div>
                <ThemeProvider theme={darkTheme}>
                    <SidePanel
                        dark
                        open={sidePanelOpen}
                        position={orientation === 'portrait' ? 'bottom' : 'right'}
                        onClose={() => {
                            changeFlow({ sidepanel: null });
                        }}
                        onOpen={() => setSidePanelOpen(true)}
                    >
                        <Outlet />
                    </SidePanel>
                </ThemeProvider>
            </div>
            <SettingsDialog />
        </>
    );
}
