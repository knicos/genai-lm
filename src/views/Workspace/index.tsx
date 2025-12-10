import { useEffect, useState } from 'react';
import style from './style.module.css';
import TextTrainer from '../../workflow/TextTraining/TextTraining';
import TextGenerator from '../../workflow/TextGenerator/TextGenerator';
import { TeachableLLM } from '@genai-fi/nanogpt';
import TextData from '../../workflow/TextData/TextData';
import { IConnection, SidePanel, WorkflowLayout } from '@genai-fi/base';
import AppBar from '../../components/AppBar';
import Evaluation from '../../workflow/Evaluation/Evaluation';
import { useAtom, useAtomValue } from 'jotai';
import { workflowSteps } from '../../state/workflowSettings';
import SettingsDialog from '../../components/SettingsDialog/SettingsDialog';
import XAIBox from '../../workflow/XAI/XAI';
import DeviceProbe from '../../components/DeviceProbe/DeviceProbe';
import { deviceDetected, devicePerformProbe } from '../../state/device';
import { Outlet, useLocation, useNavigate, useOutlet, useSearchParams } from 'react-router-dom';
import logger, { initializeLogger } from '../../utilities/logger';
import LanguageModel from '../../workflow/LanguageModel/LanguageModel';
import { useTranslation } from 'react-i18next';
import { uiShowSidePanel } from '../../state/uiState';
import { modelAtom } from '../../state/model';
import { datasetAtom } from '../../state/data';
import useOrientation from '../../utilities/useOrientation';

const CONNECTIONS: IConnection[] = [
    { start: 'info', end: 'trainer', startPoint: 'right', endPoint: 'left' },
    {
        start: 'textData',
        end: 'trainer',
        startPoint: 'right',
        endPoint: 'left',
    },
    { start: 'textData', end: 'textBrowser', startPoint: 'bottom', endPoint: 'top' },
    { start: 'trainer', end: 'evaluation', startPoint: 'right', endPoint: 'left' },
    { start: 'thread', end: 'trainer', startPoint: 'bottom', endPoint: 'top' },
    {
        start: 'thread',
        end: 'generator',
        startPoint: 'bottom',
        endPoint: 'top',
        startOffset: 0.6,
    },
    { start: 'generator', end: 'xai', startPoint: 'right', endPoint: 'left' },
];

export function Component() {
    const { t } = useTranslation();
    const [model, setModel] = useAtom(modelAtom);
    const [textDataset, setTextDataset] = useAtom(datasetAtom);
    const steps = useAtomValue(workflowSteps);
    const [conn, setConn] = useState<IConnection[]>(CONNECTIONS);
    const detected = useAtomValue(deviceDetected);
    const performProbe = useAtomValue(devicePerformProbe);
    const [params] = useSearchParams();
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
    }, [model, textDataset]);
    useEffect(() => {
        setConn([...CONNECTIONS]);
    }, [textDataset]);

    return performProbe && !detected ? (
        <DeviceProbe />
    ) : (
        <>
            <AppBar />
            <div
                className={style.mainContainer}
                style={{ flexDirection: orientation === 'portrait' ? 'column' : 'row' }}
            >
                <div className={style.workspaceContainer}>
                    <WorkflowLayout
                        connections={conn}
                        ignoredColumns={1}
                    >
                        <div
                            className={style.modelRow}
                            data-widget="container"
                        >
                            <h1>{t('model.languageModel')}</h1>
                            <LanguageModel
                                model={model ?? undefined}
                                onModel={setModel}
                            />
                        </div>
                        <section
                            className={style.trainingGroup}
                            data-widget="container"
                        >
                            <h1>{t('model.preTraining')}</h1>
                            <div
                                data-widget="container"
                                className={style.widgetRow}
                            >
                                <TextData
                                    model={model ?? undefined}
                                    dataset={textDataset}
                                    onDatasetChange={setTextDataset}
                                />
                                <TextTrainer
                                    model={model ?? undefined}
                                    dataset={textDataset}
                                />
                                {steps.has('evaluation') && <Evaluation model={model ?? undefined} />}
                            </div>
                        </section>
                        <TextGenerator model={model ?? undefined} />
                        {steps.has('xai') && <XAIBox model={model ?? undefined} />}
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
