import { useRef } from 'react';
import { TeachableLLM } from '@genai-fi/nanogpt';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { modelAtom, modelConfigAtom } from '../../state/model';
import { createEntriesFromManifest, dataEntries, dataTokens } from '../../state/data';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FlowType } from '../../hooks/useChangePath';
import { get, del } from 'idb-keyval';

const PRETRAINED_URL = 'https://store.gen-ai.fi/llm/BPE_Stories.zip';

export default function Initialiser() {
    const { t } = useTranslation();
    // const [searchParams] = useSearchParams();
    const modelConfig = useAtomValue(modelConfigAtom);
    const [, setModel] = useAtom(modelAtom);
    const { flow } = useParams() as { flow: FlowType };
    const setDataTokens = useSetAtom(dataTokens);
    const setDataEntries = useSetAtom(dataEntries);

    const pageLog = useRef(new Set<string>());

    const buildModel = async () => {
        const newModel = TeachableLLM.create(modelConfig.vocabSize <= 256 ? 'char' : 'bpe', modelConfig);
        newModel.meta.id = 'untrained-custom';
        newModel.meta.name = t('model.defaultName');
        newModel.meta.trained = false;
        setModel(newModel);
        del('dataTokens_tokens');
        del('dataTokens_tokeniserId');
        del('dataTokens_datasetId');
    };

    const loadModel = async (url: string) => {
        const blob = await fetch(url).then((res) => res.blob());
        const file = new File([blob], `model.zip`, { type: 'application/zip' });
        const newModel = TeachableLLM.loadModel(file, { sourceURL: url });
        setModel(newModel);
        del('dataTokens_tokens');
        del('dataTokens_tokeniserId');
        del('dataTokens_datasetId');
    };

    const initialise = async () => {
        const checkpoint = await get('model_checkpoint');

        if (checkpoint) {
            const newModel = TeachableLLM.loadModel(checkpoint as File);
            setModel(newModel);

            const existingTokens: Uint16Array | undefined = await get('dataTokens_tokens');
            const existingTokeniserId: string | undefined = await get('dataTokens_tokeniserId');
            const existingDatasetId: string | undefined = await get('dataTokens_datasetId');

            newModel.on('loaded', () => {
                if (existingTokens && existingTokeniserId === newModel.tokeniser.id && existingDatasetId) {
                    setDataTokens({
                        tokens: existingTokens,
                        tokeniserId: existingTokeniserId,
                        datasetId: existingDatasetId,
                    });
                } else {
                    setDataTokens(null);
                    del('dataTokens_tokens');
                    del('dataTokens_tokeniserId');
                    del('dataTokens_datasetId');
                }

                if (newModel.meta.pretrainingData) {
                    createEntriesFromManifest(newModel.meta.pretrainingData).then((entries) => {
                        setDataEntries(entries);
                    });
                }
            });

            return;
        }

        if (flow === 'data') {
            buildModel().catch((e) => {
                console.error('Failed to build model', e);
            });
        } else if (flow === 'pretrain') {
            // Load and tokenise data
            buildModel().catch((e) => {
                console.error('Failed to build model', e);
            });
            // Also load data
        } else if (flow === 'finetune') {
            loadModel(PRETRAINED_URL).catch((e) => {
                console.error('Failed to load pretrained model', e);
            });
        }
    };

    if (pageLog.current.size === 0 && flow !== 'home') {
        initialise();
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

    return null;
}
