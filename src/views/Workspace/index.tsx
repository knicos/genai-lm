import { useEffect, useState } from 'react';
import style from './style.module.css';
import TextTrainer from '../../workflow/TextTraining/TextTraining';
import { TeachableLLM } from '@genai-fi/nanogpt';
import TextData from '../../workflow/TextData/TextData';
import { IConnection, SidePanel, WorkflowLayout } from '@genai-fi/base';
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
import { datasetAtom } from '../../state/data';
import useOrientation from '../../hooks/useOrientation';
import ChatOutput from '../../workflow/ChatOutput/ChatOutput';
import Prompt from '../../workflow/Prompt/Prompt';
import TrainerLink from './linkboxes/TrainerLink';
import ProcessDataLink from './linkboxes/ProcessDataLink';
import TokeniseData from '../../workflow/TokeniseData/TokeniseData';
import ArchitectureLink from './linkboxes/Architecture';
import PreTrainedModel from '../../workflow/PreTrainedModel/PreTrainedModel';
import Initialiser, { flowType } from './Initialiser';
import CheckModel from '../../workflow/CheckModel/CheckModel';
import TextDataLink from './linkboxes/TextDataLink';
import InstructData from '../../workflow/InstructData/InstructData';
import TuneTraining from '../../workflow/TuneTraining/TuneTraining';
import DeployLink from './linkboxes/DeployLink';
import FineTuneLink from './linkboxes/FineTuneLink';
import PeerShareWrap from '../../components/PeerShare/PeerShareWrap';
import Sharing from '../../workflow/Sharing/Sharing';
import Tokeniser from '../../workflow/Tokeniser/Tokeniser';
import Home from './Home';

const CONNECTIONS: IConnection[] = [
    {
        start: 'tokeniseData',
        end: 'trainer',
        startPoint: 'right',
        endPoint: 'left',
        startOffset: 0.2,
        endOffset: -0.2,
    },
    {
        start: 'architecture',
        end: 'tokeniser',
        startPoint: 'bottom',
        endPoint: 'top',
        startOffset: 0.2,
        endOffset: -0.2,
    },
    {
        start: 'textData',
        end: 'tokeniser',
        startPoint: 'right',
        endPoint: 'left',
        endOffset: -0.5,
        startOffset: -0.1,
    },
    {
        start: 'tokeniser',
        end: 'tokeniseData',
        startPoint: 'bottom',
        endPoint: 'top',
        endOffset: -0.2,
        startOffset: 0.2,
    },
    {
        start: 'thread',
        end: 'checkmodel',
        startPoint: 'right',
        endPoint: 'left',
        endOffset: -0.5,
        startOffset: -0.5,
    },
    {
        start: 'checkmodel',
        end: 'textData',
        startPoint: 'right',
        endPoint: 'left',
    },
    {
        start: 'checkmodel',
        end: 'untrainedmodel',
        startPoint: 'bottom',
        endPoint: 'top',
        endOffset: -0.5,
        startOffset: -0.2,
    },
    { start: 'trainer', end: 'pretrained', startPoint: 'bottom', endPoint: 'top', startOffset: 0.2, endOffset: -0.2 },
    {
        start: 'pretrained',
        end: 'prompt',
        startPoint: 'right',
        endPoint: 'left',
    },
    {
        start: 'pretrained',
        end: 'finetuner',
        startPoint: 'bottom',
        endPoint: 'top',
    },
    {
        start: 'tuneData',
        end: 'finetuner',
        startPoint: 'right',
        endPoint: 'left',
    },
    {
        start: 'finetuner',
        end: 'deploy',
        startPoint: 'right',
        endPoint: 'left',
    },
    {
        start: 'sharing',
        end: 'pretrained',
        startPoint: 'bottom',
        endPoint: 'top',
    },
    {
        start: 'finetune',
        end: 'pretrained',
        startPoint: 'right',
        endPoint: 'left',
    },
];

export function Component() {
    const [model, setModel] = useAtom(modelAtom);
    const textDataset = useAtomValue(datasetAtom);
    const [conn, setConn] = useState<IConnection[]>(CONNECTIONS);
    const detected = useAtomValue(deviceDetected);
    const performProbe = useAtomValue(devicePerformProbe);
    const [params] = useSearchParams();
    const { flow } = useParams() as { flow: flowType };
    const [sidePanelOpen, setSidePanelOpen] = useAtom(uiShowSidePanel);
    const location = useLocation();
    const outlet = useOutlet();
    const navigate = useNavigate();
    const orientation = useOrientation();

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

    // Hack to update lines when model changes
    useEffect(() => {
        if (model) {
            const h = () => {
                setConn([...CONNECTIONS]);
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

    useEffect(() => {
        setConn([...CONNECTIONS]);
    }, [textDataset, flow]);

    const isInputStage = flow === 'model' || flow === 'pretraindata' || flow === 'finetune';
    const isOutputStage = !isInputStage && flow !== 'home';

    return performProbe && !detected ? (
        <DeviceProbe />
    ) : (
        <>
            <Initialiser />
            <PeerShareWrap />
            <AppBar hideTitle />
            <div
                className={style.mainContainer}
                style={{ flexDirection: orientation === 'portrait' ? 'column' : 'row' }}
            >
                <div className={`${style.workspaceContainer} ${flow === 'home' ? style.homeWorkspace : ''}`}>
                    <WorkflowLayout connections={conn}>
                        {isInputStage && (
                            <section
                                className={style.inputGroup}
                                data-widget="container"
                            >
                                <div
                                    className={style.inputContainer}
                                    data-widget="container"
                                >
                                    {flow === 'pretraindata' && <TextData />}
                                    {flow === 'model' && <LanguageModel />}
                                    {flow === 'finetune' && <InstructData />}
                                </div>
                            </section>
                        )}
                        <section
                            className={`${style.processGroup} ${flow === 'home' ? style.homeProcess : ''}`}
                            data-widget="container"
                        >
                            {flow === 'home' && <Home />}
                            {flow === 'model' && (
                                <>
                                    <div
                                        data-widget="container"
                                        className={style.subgroup}
                                    >
                                        <CheckModel />
                                        <PreTrainedModel
                                            hideMenu
                                            widget="untrainedmodel"
                                        />
                                    </div>
                                    <div
                                        data-widget="container"
                                        className={style.subgroup}
                                    >
                                        <TextDataLink />
                                    </div>
                                </>
                            )}
                            {flow === 'pretraindata' && (
                                <>
                                    <div
                                        data-widget="container"
                                        className={style.subgroup}
                                    >
                                        <ArchitectureLink flip />
                                        <Tokeniser />
                                        <TokeniseData />
                                    </div>

                                    <div
                                        data-widget="container"
                                        className={style.subgroup}
                                    >
                                        <TrainerLink />
                                    </div>
                                </>
                            )}
                            {flow === 'pretrain' && (
                                <>
                                    <div
                                        data-widget="container"
                                        className={style.subgroup}
                                    >
                                        <ProcessDataLink flip />
                                    </div>
                                    <div
                                        data-widget="container"
                                        className={style.subgroup}
                                    >
                                        <TextTrainer />
                                        <PreTrainedModel />
                                    </div>
                                </>
                            )}
                            {flow === 'finetune' && (
                                <>
                                    <div
                                        data-widget="container"
                                        className={style.subgroup}
                                    >
                                        <TrainerLink />
                                        <PreTrainedModel />
                                        <TuneTraining />
                                    </div>
                                    <div
                                        data-widget="container"
                                        className={style.subgroup}
                                    >
                                        <DeployLink />
                                    </div>
                                </>
                            )}
                            {flow === 'deployment' && (
                                <>
                                    <div
                                        data-widget="container"
                                        className={style.subgroup}
                                    >
                                        <FineTuneLink flip />
                                    </div>
                                    <div
                                        data-widget="container"
                                        className={style.subgroup}
                                    >
                                        <Sharing />
                                        <PreTrainedModel />
                                    </div>
                                </>
                            )}
                        </section>
                        {isOutputStage && (
                            <section
                                className={style.chatGroup}
                                data-widget="container"
                            >
                                <div
                                    className={style.chatOutputContainer}
                                    data-widget="container"
                                >
                                    {(flow === 'pretrain' || flow === 'deployment') && (
                                        <ChatOutput nonConversational={flow === 'pretrain'} />
                                    )}
                                </div>
                                <div
                                    className={style.promptGroup}
                                    data-widget="container"
                                >
                                    {flow === 'pretrain' && <Prompt />}
                                    {flow === 'deployment' && <Prompt showPromptInput />}
                                </div>
                            </section>
                        )}
                    </WorkflowLayout>
                </div>
                <SidePanel
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
            </div>
            <SettingsDialog />
        </>
    );
}
