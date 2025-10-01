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
import ModelInfo from '../../workflow/ModelInfo/ModelInfo';
import { useAtomValue } from 'jotai';
import { workflowSteps } from '../../state/workflowSettings';
import SettingsDialog from '../../components/SettingsDialog/SettingsDialog';
import Annotation from './Annotation';
import XAIBox from '../../workflow/XAI/XAI';

const CONNECTIONS: IConnection[] = [
    {
        start: 'model',
        end: 'trainer',
        startPoint: 'right',
        endPoint: 'left',
        annotationElement: (
            <Annotation
                label="Model"
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
                label="Data"
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
                label="Model"
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

    // Hack to update lines when model changes
    useEffect(() => {
        if (model) {
            const h = () => {
                setConn([...CONNECTIONS]);
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

    return (
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
                    {steps.has('modelInfo') && (
                        <div
                            className={style.box}
                            data-widget="info"
                            style={{ width: 'unset' }}
                        >
                            <ModelInfo model={model} />
                        </div>
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
                    {steps.has('evaluation') && (
                        <div
                            className={style.box}
                            data-widget="evaluation"
                        >
                            <Evaluation model={model} />
                        </div>
                    )}
                </div>
                <TextGenerator model={model} />
                {steps.has('xai') && <XAIBox model={model} />}
            </WorkflowLayout>
            <SettingsDialog />
        </>
    );
}
