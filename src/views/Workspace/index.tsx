import { useEffect, useState } from 'react';
import style from './style.module.css';
import TextTrainer from '../../workflow/TextTraining/TextTraining';
import TextGenerator from '../../workflow/TextGenerator/TextGenerator';
import { TeachableLLM } from '@genai-fi/nanogpt';
import ModelLoader from '../../workflow/ModelLoader/ModelLoader';
import TextData from '../../workflow/TextData/TextData';
import { IConnection, WorkflowLayout } from '@genai-fi/base';
import AppBar from '../../components/AppBar';
import Evaluation from '../../workflow/Evaluation/Evaluation';
import { useAtomValue } from 'jotai';
import { workflowSteps } from '../../state/workflowSettings';
import SettingsDialog from '../../components/SettingsDialog/SettingsDialog';
import Annotation from './Annotation';
import XAIBox from '../../workflow/XAI/XAI';
import DeviceProbe from '../../components/DeviceProbe/DeviceProbe';
import { deviceMemory, devicePerformProbe } from '../../state/device';
import { useSearchParams } from 'react-router-dom';
import logger, { initializeLogger } from '../../utilities/logger';

const CONNECTIONS: IConnection[] = [
    {
        start: 'model',
        end: 'trainer',
        startPoint: 'right',
        endPoint: 'left',
        annotationElement: (
            <Annotation
                label="app.annotations.model"
                type="model"
            />
        ),
    },
    { start: 'info', end: 'trainer', startPoint: 'right', endPoint: 'left' },
    {
        start: 'textData',
        end: 'trainer',
        startPoint: 'right',
        endPoint: 'left',
        startOffset: -0.6,
        annotationElement: (
            <Annotation
                label="app.annotations.data"
                type="data"
                animate
            />
        ),
    },
    { start: 'textData', end: 'textBrowser', startPoint: 'bottom', endPoint: 'top' },
    { start: 'trainer', end: 'evaluation', startPoint: 'bottom', endPoint: 'top' },
    {
        start: 'trainer',
        end: 'generator',
        startPoint: 'right',
        endPoint: 'left',
        annotationElement: (
            <Annotation
                label="app.annotations.model"
                type="model"
                animate
            />
        ),
    },
    { start: 'generator', end: 'xai', startPoint: 'right', endPoint: 'left' },
];

export function Component() {
    const [model, setModel] = useState<TeachableLLM | undefined>(undefined);
    const [textDataset, setTextDataset] = useState<string[]>([]);
    const steps = useAtomValue(workflowSteps);
    const [conn, setConn] = useState<IConnection[]>(CONNECTIONS);
    const memory = useAtomValue(deviceMemory);
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

    return performProbe && memory === null ? (
        <DeviceProbe />
    ) : (
        <>
            <AppBar
                onModel={setModel}
                model={model}
            />
            <WorkflowLayout connections={conn}>
                <div
                    className={style.verticalBox}
                    data-widget="container"
                    style={{ width: '390px', maxWidth: '100%' }}
                >
                    <TextData
                        model={model}
                        dataset={textDataset}
                        onDatasetChange={setTextDataset}
                    />
                </div>
                <div
                    className={style.verticalBox}
                    data-widget="container"
                    style={{ width: '390px', maxWidth: '100%', marginTop: '15rem' }}
                >
                    {steps.has('model') && (
                        <ModelLoader
                            model={model}
                            onModel={(m: TeachableLLM) => {
                                setModel(m);
                            }}
                        />
                    )}
                </div>
                <div
                    className={style.verticalBox}
                    data-widget="container"
                    style={{ paddingLeft: '5rem', paddingRight: '5rem', boxSizing: 'border-box' }}
                >
                    <TextTrainer
                        model={model}
                        dataset={textDataset}
                    />
                    {steps.has('evaluation') && <Evaluation model={model} />}
                </div>
                <TextGenerator model={model} />
                {steps.has('xai') && <XAIBox model={model} />}
            </WorkflowLayout>
            <SettingsDialog />
        </>
    );
}
