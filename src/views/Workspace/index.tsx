import { useEffect, useRef, useState } from 'react';
import style from './style.module.css';
import TextTrainer from '../../workflow/TextTraining/TextTraining';
import { TeachableLLM } from '@genai-fi/nanogpt';
import TextData from '../../workflow/TextData/TextData';
import { SidePanel, WorkflowLayout } from '@genai-fi/base';
import AppBar from '../../components/AppBar';
import { useAtom, useAtomValue } from 'jotai';
import SettingsDialog from '../../components/SettingsDialog/SettingsDialog';
import DeviceProbe from '../../components/DeviceProbe/DeviceProbe';
import { deviceDetected, devicePerformProbe } from '../../state/device';
import { Outlet, useLocation, useNavigate, useOutlet, useParams, useSearchParams } from 'react-router-dom';
import logger, { initializeLogger } from '../../utilities/logger';
import LanguageModel from '../../workflow/LanguageModel/LanguageModel';
import { uiShowSidePanel } from '../../state/uiState';
import { modelAtom } from '../../state/model';
import useOrientation from '../../hooks/useOrientation';
import TokeniseData from '../../workflow/TokeniseData/TokeniseData';
import PreTrainedModel from '../../workflow/PreTrainedModel/PreTrainedModel';
import Initialiser, { flowType } from './Initialiser';
import CheckModel from '../../workflow/CheckModel/CheckModel';
import InstructData from '../../workflow/InstructData/InstructData';
import TuneTraining from '../../workflow/TuneTraining/TuneTraining';
import PeerShareWrap from '../../components/PeerShare/PeerShareWrap';
import Sharing from '../../workflow/Sharing/Sharing';
import Tokeniser from '../../workflow/Tokeniser/Tokeniser';
import Home from './Home';
import Frame from './Frame';
import { CONNECTIONS } from './connections';
import { darkTheme } from '@genai-fi/base';
import { ThemeProvider } from '@mui/material';
import useChangeFlow from '../../hooks/useChangeFlow';
import RawGeneration from '../../workflow/ChatOutput/RawGeneration';
import ChatConversation from '../../workflow/ChatOutput/ChatConversation';
import RawPrompt from '../../workflow/Prompt/RawPrompt';
import ChatPrompt from '../../workflow/Prompt/ChatPrompt';

export function Component() {
    const [model, setModel] = useAtom(modelAtom);
    const detected = useAtomValue(deviceDetected);
    const performProbe = useAtomValue(devicePerformProbe);
    const [params] = useSearchParams();
    const { flow } = useParams() as { flow: flowType };
    const [sidePanelOpen, setSidePanelOpen] = useAtom(uiShowSidePanel);
    const location = useLocation();
    const outlet = useOutlet();
    const changeFlow = useChangeFlow();
    const navigate = useNavigate();
    const orientation = useOrientation();
    const routeToScrollLock = useRef<flowType | null>(flow);
    const visibleFlow = useRef<flowType | null>(null);
    const intersectionObserver = useRef<IntersectionObserver | null>(null);
    const [scrollFrame, setScrollFrame] = useState<flowType | null>(null);

    if (!intersectionObserver.current) {
        intersectionObserver.current = new IntersectionObserver(
            (entries) => {
                const intersecting = entries.find((e) => e.isIntersecting);
                if (intersecting) {
                    const name = intersecting.target.id.replace('frame-', '') as flowType;
                    visibleFlow.current = name;
                    if (routeToScrollLock.current === null) {
                        changeFlow(name);
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
            // If frame is visible already then do not scroll again
            if (visibleFlow.current === flow) {
                return;
            }

            routeToScrollLock.current = flow;
            setScrollFrame(flow);
        }
    }, [flow]);

    useEffect(() => {
        const token = params.get('t');
        if (token) {
            initializeLogger(token);
        }

        const hf = params.get('hf');
        if (hf) {
            const m = TeachableLLM.loadModel(hf);
            setModel(m);
        }
    }, [params, setModel]);

    useEffect(() => {
        if (model) {
            const h = () => {
                logger.log({
                    action: 'model_loaded',
                    name: model.meta.name,
                    id: model.meta.id,
                    params: model.getNumParams(),
                });
            };
            model.on('loaded', h);
            return () => {
                model.off('loaded', h);
            };
        }
    }, [model]);

    return performProbe && !detected ? (
        <DeviceProbe />
    ) : (
        <>
            <Initialiser />
            <PeerShareWrap />
            <AppBar
                hideTitle
                sidepanel={location.pathname.split('/')[3]}
            />
            <div
                className={style.mainContainer}
                style={{ flexDirection: orientation === 'portrait' ? 'column' : 'row' }}
            >
                <div className={`${style.workspaceContainer} ${flow === 'home' ? style.homeWorkspace : ''}`}>
                    {flow === 'home' && <Home />}
                    {flow !== 'home' && (
                        <WorkflowLayout connections={CONNECTIONS}>
                            <Frame
                                name="model"
                                observer={intersectionObserver.current}
                                scroll={scrollFrame === 'model'}
                            >
                                <LanguageModel />
                                <CheckModel />
                            </Frame>
                            <Frame
                                name="pretraindata"
                                observer={intersectionObserver.current}
                                scroll={scrollFrame === 'pretraindata'}
                            >
                                <TextData />
                                <div
                                    data-widget="container"
                                    className={style.subgroup}
                                >
                                    <Tokeniser />
                                    <TokeniseData />
                                </div>
                            </Frame>
                            <Frame
                                name="pretrain"
                                observer={intersectionObserver.current}
                                scroll={scrollFrame === 'pretrain'}
                            >
                                <TextTrainer />
                                <section
                                    data-widget="container"
                                    className={style.chatGroup}
                                >
                                    <RawGeneration />
                                    <RawPrompt />
                                </section>
                            </Frame>
                            <Frame
                                name="finetune"
                                observer={intersectionObserver.current}
                                scroll={scrollFrame === 'finetune'}
                            >
                                <InstructData />
                                <TuneTraining />
                            </Frame>
                            <Frame
                                name="deployment"
                                observer={intersectionObserver.current}
                                scroll={scrollFrame === 'deployment'}
                            >
                                <Sharing />
                                <section
                                    data-widget="container"
                                    className={style.chatGroup}
                                >
                                    <ChatConversation />
                                    <ChatPrompt />
                                </section>
                            </Frame>
                        </WorkflowLayout>
                    )}
                    {flow !== 'home' && (
                        <div className={style.modelOverlay}>
                            <PreTrainedModel />
                        </div>
                    )}
                </div>
                <ThemeProvider theme={darkTheme}>
                    <SidePanel
                        dark
                        open={sidePanelOpen}
                        position={orientation === 'portrait' ? 'bottom' : 'right'}
                        onClose={() => {
                            const segments = location.pathname.split('/').filter(Boolean);
                            if (segments.length > 0) {
                                segments.pop(); // Remove last segment
                                const newPath = '/' + segments.join('/');
                                navigate(newPath, { replace: true });
                            }
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
