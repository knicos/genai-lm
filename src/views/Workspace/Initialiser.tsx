import { useRef, useState } from 'react';
import { TeachableLLM } from '@genai-fi/nanogpt';
import { useAtom } from 'jotai';
import { modelAtom, modelConfigAtom } from '../../state/model';
import waitModelLoaded from '../../utilities/waitModelLoaded';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Modal } from '@mui/material';
import { Spinner } from '@genai-fi/base';
import style from './style.module.css';

export type flowType = 'model' | 'pretraindata' | 'pretrain' | 'finetune' | 'deployment' | 'home';

const PRETRAINED_URL = 'https://store.gen-ai.fi/llm/BPE_Stories.zip';

export default function Initialiser() {
    const { t } = useTranslation();
    // const [searchParams] = useSearchParams();
    const [modelConfig, setModelConfig] = useAtom(modelConfigAtom);
    const [, setModel] = useAtom(modelAtom);
    const { flow } = useParams() as { flow: flowType };
    const [loading, setLoading] = useState(false);

    const pageLog = useRef(new Set<string>());

    const buildModel = async () => {
        const newModel = TeachableLLM.create(modelConfig.vocabSize <= 256 ? 'char' : 'bpe', modelConfig);
        newModel.meta.id = 'untrained-custom';
        newModel.meta.name = t('model.defaultName');
        newModel.meta.trained = false;
        await waitModelLoaded(newModel);
        setModel(newModel);
    };

    const loadModel = async (url: string) => {
        const blob = await fetch(url).then((res) => res.blob());
        const file = new File([blob], `model.zip`, { type: 'application/zip' });
        const newModel = TeachableLLM.loadModel(file, { sourceURL: url });
        newModel.meta.id = 'unknown-loaded';
        newModel.meta.name = t('model.defaultName');
        newModel.meta.trained = true;

        await waitModelLoaded(newModel);
        setModel(newModel);
        setModelConfig(newModel.config);
    };

    if (pageLog.current.size === 0 && flow !== 'home') {
        console.log(`Visited page for first time: ${flow}`);
        if (flow === 'pretraindata') {
            setLoading(true);
            buildModel()
                .then(() => {
                    setLoading(false);
                })
                .catch((e) => {
                    console.error('Failed to build model', e);
                    setLoading(false);
                });
        } else if (flow === 'pretrain') {
            setLoading(true);
            // Load and tokenise data
            buildModel()
                .then(() => {
                    setLoading(false);
                })
                .catch((e) => {
                    console.error('Failed to build model', e);
                    setLoading(false);
                });
            // Also load data
        } else if (flow === 'finetune') {
            setLoading(true);
            loadModel(PRETRAINED_URL)
                .then(() => {
                    setLoading(false);
                })
                .catch((e) => {
                    console.error('Failed to load pretrained model', e);
                    setLoading(false);
                });
        }
    }
    if (flow !== 'home') {
        pageLog.current.add(flow);
    }

    /*const modelParam = searchParams.get('model');

    useEffect(() => {
        // Use provided model id from URL params
        if (modelParam) {
            loadModelById(modelParam);
            // Load untrained model for pretrain workflow
        } else {
            // loadModelById('untrained-small');
        }
    }, [modelParam, loadModelById]);*/
    return (
        <Modal open={loading}>
            <div className={style.loadingContainer}>
                <Spinner />
            </div>
        </Modal>
    );
}
