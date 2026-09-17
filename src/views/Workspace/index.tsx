import { useCallback, useEffect, useMemo, useRef } from 'react';
import style from './style.module.css';
import { SidePanel, WorkflowLayout } from '@genai-fi/base';
import AppBar from '../../components/AppBar';
import { useAtomValue } from 'jotai';
import SettingsDialog from '../../components/SettingsDialog/SettingsDialog';
import DeviceProbe from '../../components/DeviceProbe/DeviceProbe';
import { deviceDetected, devicePerformProbe } from '../../state/device';
import { Outlet, useLocation, useOutlet, useParams } from 'react-router';
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
    const location = useLocation();
    const outlet = useOutlet();
    const changeFlow = useChangePath();
    const orientation = useOrientation();
    const programmaticScroll = useRef<boolean>(false);
    const visibleFlow = useRef<Set<FlowType>>(new Set());
    const flowRef = useRef<FlowType | null>(flow);
    const intersectionObserver = useRef<IntersectionObserver | null>(null);
    const steps = useAtomValue(workflowSteps);
    const resizeObserver = useRef<ResizeObserver | null>(null);
    const workspaceContainerRef = useRef<HTMLDivElement | null>(null);
    const frameMapRef = useRef<Map<FlowType, HTMLDivElement>>(new Map());

    flowRef.current = flow;

    const doScroll = useCallback((flow: FlowType) => {
        // If frame is visible already then do not scroll again
        if (visibleFlow.current.has(flow)) {
            return;
        }
        const element = frameMapRef.current.get(flow);
        if (element) {
            programmaticScroll.current = true;
            element.scrollIntoView({
                behavior: performance.now() > 5000 ? 'smooth' : 'instant',
                block: 'center',
            });
        } else {
            console.warn('No element found for frame:', flow);
        }
    }, []);

    if (!resizeObserver.current) {
        const resizeState = {
            timer: -1,
        };
        resizeObserver.current = new ResizeObserver(() => {
            clearTimeout(resizeState.timer);
            resizeState.timer = window.setTimeout(() => {
                const flow = flowRef.current;
                if (flow) {
                    doScroll(flow);
                }
            }, 400);
        });
    }

    if (!intersectionObserver.current) {
        intersectionObserver.current = new IntersectionObserver(
            (entries) => {
                const newSet = new Set<FlowType>(visibleFlow.current);

                entries.forEach((entry) => {
                    const name = entry.target.id.replace('frame-', '') as FlowType;
                    if (entry.isIntersecting) {
                        newSet.add(name);
                    } else {
                        newSet.delete(name);
                    }
                });

                visibleFlow.current = newSet;
            },
            { threshold: 0.55 }
        );
    }

    const registerFrame = useCallback(
        (flow: FlowType, element: HTMLDivElement | null) => {
            if (!element) {
                const oldElement = frameMapRef.current.get(flow);
                if (oldElement) {
                    intersectionObserver.current?.unobserve(oldElement);
                    frameMapRef.current.delete(flow);
                }
                return;
            }
            frameMapRef.current.set(flow, element);
            intersectionObserver.current?.observe(element);
            if (flowRef.current === flow) {
                doScroll(flow);
            }
        },
        [doScroll]
    );

    const hasOutlet = !!outlet;

    useEffect(() => {
        if (flow) {
            if (flow === 'home') {
                visibleFlow.current.clear();
                return;
            }

            doScroll(flow);
        }
    }, [flow, doScroll]);

    const connections = useMemo(() => {
        if (steps.has('tokenise')) {
            return CONNECTIONS.filter((c) => !(c.start === 'textData' && c.end === 'trainer'));
        }
        if (steps.has('trainer')) {
            return CONNECTIONS.filter((c) => !(c.start === 'foundation' && c.end === 'chatOutput'));
        }
        return CONNECTIONS;
    }, [steps]);

    const onScrollEnd = useCallback(() => {
        if (flowRef.current && visibleFlow.current.has(flowRef.current)) {
            return;
        }
        const name = Array.from(visibleFlow.current).pop();
        if (!programmaticScroll.current) {
            changeFlow({ flow: name, replace: true, preserveSearch: true });
        }
        programmaticScroll.current = false;
    }, [changeFlow]);

    const setRef = useCallback(
        (el: HTMLDivElement | null) => {
            if (workspaceContainerRef.current) {
                resizeObserver.current?.unobserve(workspaceContainerRef.current);
                workspaceContainerRef.current.firstElementChild?.removeEventListener('scrollend', onScrollEnd);
            }

            workspaceContainerRef.current = el;

            if (el && resizeObserver.current) {
                resizeObserver.current.observe(el);
                el.firstElementChild?.addEventListener('scrollend', onScrollEnd);
            }
        },
        [onScrollEnd]
    );

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
            <main
                className={style.mainContainer}
                style={{ flexDirection: orientation === 'portrait' ? 'column' : 'row' }}
            >
                <div
                    className={`${style.workspaceContainer} ${flow === 'home' ? style.homeWorkspace : ''}`}
                    ref={setRef}
                >
                    {flow === 'home' && <Home />}
                    {flow !== 'home' && (
                        <WorkflowLayout connections={connections}>
                            <ModelFrame registerFrame={registerFrame} />
                            <DataFrame registerFrame={registerFrame} />
                            <PretrainFrame registerFrame={registerFrame} />
                            <DeploymentFrame registerFrame={registerFrame} />
                            <FinetuneFrame registerFrame={registerFrame} />
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
                        open={hasOutlet}
                        position={orientation === 'portrait' ? 'bottom' : 'right'}
                        onClose={() => {
                            //programmaticScroll.current = true;
                            changeFlow({ sidepanel: null });
                        }}
                    >
                        <Outlet />
                    </SidePanel>
                </ThemeProvider>
            </main>
            <SettingsDialog />
        </>
    );
}
