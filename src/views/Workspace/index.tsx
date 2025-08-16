import { useState } from 'react';
import style from './style.module.css';
import TextTrainer from '../../components/TextTraining/TextTraining';
import TextGenerator from '../../components/TextGenerator/TextGenerator';
import { TeachableLLM } from '@genai-fi/nanogpt';
import ModelLoader from '../../components/ModelLoader/ModelLoader';
import TextData from '../../components/TextData/TextData';
import { IConnection, WorkflowLayout } from '@genai-fi/base';
import SampleViewer from '../../components/SampleViewer/SampleViewer';
import useModelStatus from '../../utilities/useModelStatus';
import AppBar from '../../components/AppBar';
import Evaluation from '../../components/Evaluation/Evaluation';
import ModelInfo from '../../components/ModelInfo/ModelInfo';

const CONNECTIONS: IConnection[] = [
    { start: 'model', end: 'textData', startPoint: 'right', endPoint: 'left' },
    { start: 'model', end: 'info', startPoint: 'bottom', endPoint: 'top' },
    { start: 'textData', end: 'trainer', startPoint: 'right', endPoint: 'left' },
    { start: 'textData', end: 'textBrowser', startPoint: 'bottom', endPoint: 'top' },
    { start: 'trainer', end: 'evaluation', startPoint: 'bottom', endPoint: 'top' },
    { start: 'trainer', end: 'generator', startPoint: 'right', endPoint: 'left' },
];

export function Component() {
    const [model, setModel] = useState<TeachableLLM | undefined>(undefined);
    const [textDataset, setTextDataset] = useState<string[]>([]);
    const status = useModelStatus(model);

    /*useEffect(() => {
        if (textDataset && textDataset.length > 0) {
            const tokeniser = new CharTokeniser();
            tokeniser.train(textDataset);
            const newModel = TeachableLLM.create(tf, tokeniser);
            setModel(newModel);
        }
    }, [textDataset]);*/

    return (
        <>
            <AppBar
                onModel={setModel}
                model={model}
            />
            <WorkflowLayout connections={CONNECTIONS}>
                <div
                    className={style.verticalBox}
                    data-widget="container"
                >
                    <div
                        className={style.box}
                        data-widget="model"
                    >
                        <ModelLoader
                            model={model}
                            onModel={(m: TeachableLLM) => {
                                setModel(m);
                            }}
                        />
                    </div>
                    <div
                        className={style.box}
                        data-widget="info"
                    >
                        <ModelInfo model={model} />
                    </div>
                </div>
                <div
                    className={style.verticalBox}
                    data-widget="container"
                >
                    <div
                        className={style.box}
                        data-widget="textData"
                    >
                        <TextData
                            model={model}
                            dataset={textDataset}
                            onDatasetChange={setTextDataset}
                        />
                    </div>
                    <div
                        className={style.box}
                        data-widget="textBrowser"
                    >
                        <SampleViewer
                            samples={textDataset}
                            contextSize={model && status !== 'loading' ? model.config.blockSize : 128}
                            parameters={model && status !== 'loading' ? model.getNumParams() : undefined}
                        />
                    </div>
                </div>
                <div
                    className={style.verticalBox}
                    data-widget="container"
                >
                    <div
                        className={style.box}
                        data-widget="trainer"
                    >
                        <TextTrainer
                            model={model}
                            dataset={textDataset}
                        />
                    </div>
                    <div
                        className={style.box}
                        data-widget="evaluation"
                    >
                        <Evaluation model={model} />
                    </div>
                </div>
                <div
                    className={style.box}
                    data-widget="generator"
                >
                    <TextGenerator model={model} />
                </div>
            </WorkflowLayout>
        </>
    );
}
