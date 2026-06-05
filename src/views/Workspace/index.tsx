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
import { Outlet, useLocation, useOutlet, useParams, useSearchParams } from 'react-router-dom';
import logger, { initializeLogger } from '../../utilities/logger';
import ModelDesign from '../../workflow/ModelDesign/ModelDesign';
import { uiShowSidePanel } from '../../state/uiState';
import { modelAtom } from '../../state/model';
import useOrientation from '../../hooks/useOrientation';
import TokeniseData from '../../workflow/TokeniseData/TokeniseData';
import ModelState from '../../workflow/ModelState/ModelState';
import Initialiser from './Initialiser';
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
import { FlowType, useChangePath } from '../../hooks/useChangePath';
import RawGeneration from '../../workflow/ChatOutput/RawGeneration';
import ChatConversation from '../../workflow/ChatOutput/ChatConversation';
import RawPrompt from '../../workflow/Prompt/RawPrompt';
import ChatPrompt from '../../workflow/Prompt/ChatPrompt';
import { BoxButton } from '../../components/BoxButton/BoxButton';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useTranslation } from 'react-i18next';
import AbcIcon from '@mui/icons-material/Abc';
import MarginIcon from '@mui/icons-material/Margin';
import FullSizeGroup from './FullSizeGroup';

export function Component() {
    const { t } = useTranslation();
    const [model, setModel] = useAtom(modelAtom);
    const detected = useAtomValue(deviceDetected);
    const performProbe = useAtomValue(devicePerformProbe);
    const [params] = useSearchParams();
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

    if (!intersectionObserver.current) {
        intersectionObserver.current = new IntersectionObserver(
            (entries) => {
                const intersecting = entries.find((e) => e.isIntersecting);
                if (intersecting) {
                    const name = intersecting.target.id.replace('frame-', '') as FlowType;
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
                                <ModelDesign />
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
                                    <div className={style.rowGroup}>
                                        <Tokeniser />
                                        <BoxButton
                                            icon={<AbcIcon />}
                                            label={t('tokeniser.vocabulary')}
                                            widget="vocabulary"
                                            onClick={() => changeFlow({ sidepanel: 'vocabulary' })}
                                        />
                                    </div>
                                    <div className={style.rowGroup}>
                                        <TokeniseData />
                                        <BoxButton
                                            icon={<MarginIcon />}
                                            label={t('tokeniseData.show')}
                                            widget="tokenised-data"
                                            onClick={() => changeFlow({ sidepanel: 'tokenised-data' })}
                                            style={{ marginTop: '70px' }}
                                        />
                                    </div>
                                </div>
                            </Frame>
                            <Frame
                                name="pretrain"
                                observer={intersectionObserver.current}
                                scroll={scrollFrame === 'pretrain'}
                            >
                                <TextTrainer />
                                <div className={style.buttongroup}>
                                    <BoxButton
                                        icon={<ShowChartIcon />}
                                        label={t('training.monitor')}
                                        widget="training-monitor"
                                        onClick={() => changeFlow({ sidepanel: 'training-log' })}
                                    />
                                    <BoxButton
                                        icon={<AccountTreeIcon />}
                                        label={t('training.visualize')}
                                        widget="training-visualize"
                                        onClick={() =>
                                            changeFlow({
                                                sidepanel: 'inference-process',
                                                query: { vismode: 'training' },
                                            })
                                        }
                                    />
                                </div>
                                <FullSizeGroup widget="chatOutput">
                                    <RawGeneration />
                                    <RawPrompt />
                                </FullSizeGroup>
                                <div className={style.buttongroup}>
                                    <BoxButton
                                        style={{ marginBottom: '70px' }}
                                        icon={<AccountTreeIcon />}
                                        label={t('training.visualize')}
                                        widget="inference-visualize"
                                        onClick={() =>
                                            changeFlow({
                                                sidepanel: 'inference-process',
                                                query: { vismode: 'inference' },
                                            })
                                        }
                                    />
                                </div>
                            </Frame>
                            <Frame
                                name="finetune"
                                observer={intersectionObserver.current}
                                scroll={scrollFrame === 'finetune'}
                            >
                                <InstructData />
                                <TuneTraining />
                                <div className={style.buttongroup}>
                                    <BoxButton
                                        icon={<ShowChartIcon />}
                                        label={t('training.monitor')}
                                        widget="tuning-monitor"
                                        onClick={() => changeFlow({ sidepanel: 'training-log' })}
                                        style={{ marginTop: '120px' }}
                                    />
                                </div>
                            </Frame>
                            <Frame
                                name="deployment"
                                observer={intersectionObserver.current}
                                scroll={scrollFrame === 'deployment'}
                            >
                                <Sharing />
                                <FullSizeGroup widget="conversationOutput">
                                    <ChatConversation />
                                    <ChatPrompt />
                                </FullSizeGroup>
                            </Frame>
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
