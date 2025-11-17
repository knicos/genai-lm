import { useEffect, useState } from 'react';
import style from './style.module.css';
import TextTrainer from '../../workflow/TextTraining/TextTraining';
import TextGenerator from '../../workflow/TextGenerator/TextGenerator';
import { TeachableLLM } from '@genai-fi/nanogpt';
import TextData from '../../workflow/TextData/TextData';
import { IConnection, WorkflowLayout } from '@genai-fi/base';
import AppBar from '../../components/AppBar';
import Evaluation from '../../workflow/Evaluation/Evaluation';
import { useAtomValue } from 'jotai';
import { workflowSteps } from '../../state/workflowSettings';
import SettingsDialog from '../../components/SettingsDialog/SettingsDialog';
import XAIBox from '../../workflow/XAI/XAI';
import DeviceProbe from '../../components/DeviceProbe/DeviceProbe';
import { deviceDetected, devicePerformProbe } from '../../state/device';
import { useSearchParams } from 'react-router-dom';
import logger, { initializeLogger } from '../../utilities/logger';
import LanguageModel from '../../workflow/LanguageModel/LanguageModel';
import { useTranslation } from 'react-i18next';

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
    const [model, setModel] = useState<TeachableLLM | undefined>(undefined);
    const [textDataset, setTextDataset] = useState<string[]>([]);
    const steps = useAtomValue(workflowSteps);
    const [conn, setConn] = useState<IConnection[]>(CONNECTIONS);
    const detected = useAtomValue(deviceDetected);
    const performProbe = useAtomValue(devicePerformProbe);
    const [params] = useSearchParams();

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
    }, [params]);

    // Hack to update lines when model changes
    useEffect(() => {
        if (model) {
            const h = () => {
                setConn([...CONNECTIONS]);
                logger.log(`Model loaded: ${model.meta.name} (${model.getNumParams()} parameters)`);
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
            <AppBar
                onModel={setModel}
                model={model}
            />
            <WorkflowLayout connections={conn}>
                <div
                    className={style.modelRow}
                    data-widget="container"
                >
                    <LanguageModel
                        model={model}
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
                            model={model}
                            dataset={textDataset}
                            onDatasetChange={setTextDataset}
                        />
                        <TextTrainer
                            model={model}
                            dataset={textDataset}
                        />
                        {steps.has('evaluation') && <Evaluation model={model} />}
                    </div>
                </section>
                <TextGenerator model={model} />
                {steps.has('xai') && <XAIBox model={model} />}
            </WorkflowLayout>
            <SettingsDialog />
        </>
    );
}
