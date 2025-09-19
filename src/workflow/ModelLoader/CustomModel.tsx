import { estimateResources, TeachableLLM, validateConfig, waitForModel } from '@genai-fi/nanogpt';
import { useEffect, useState } from 'react';
import style from './CustomModel.module.css';
import NumberInput from '../../components/NumberInput/NumberInput';
import { Button } from '@genai-fi/base';
import NumberBox from '../../components/NumberBox/NumberBox';
import { useTranslation } from 'react-i18next';

const HIGH_MEMORY_THRESHOLD = 50; // in MB

interface Props {
    model: TeachableLLM | undefined;
    onModel: (model: TeachableLLM) => void;
}

export default function CustomModel({ model, onModel }: Props) {
    const { t } = useTranslation();
    const [vocab, setVocab] = useState(200);
    const [context, setContext] = useState(128);
    const [layers, setLayers] = useState(4);
    const [heads, setHeads] = useState(6);
    const [embedding, setEmbedding] = useState(192);
    const [isSame, setSame] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [params, setParams] = useState(0);
    const [memory, setMemory] = useState(0);

    useEffect(() => {
        const config = {
            nLayer: layers,
            nEmbed: embedding,
            vocabSize: vocab,
            blockSize: context,
            mlpFactor: 4,
            useRope: true,
            biasInLayerNorm: false,
            biasInLinear: false,
            dropout: 0.0,
            nHead: heads,
        };
        const profile = estimateResources(config, 32);
        setParams(profile.numParams);
        setMemory(profile.trainingMemoryMB);

        try {
            validateConfig(config);
            setValidationError(null);
        } catch (e: unknown) {
            if (e instanceof Error) {
                setValidationError(e.message);
            } else {
                setValidationError('unknown_error');
            }
            console.error('Invalid config', e);
        }
    }, [vocab, context, layers, embedding, heads]);

    useEffect(() => {
        if (model) {
            waitForModel(model).then(() => {
                setVocab(model.config.vocabSize);
                setContext(model.config.blockSize);
                setLayers(model.config.nLayer);
                setEmbedding(model.config.nEmbed);
                setHeads(model.config.nHead);
            });
        }
    }, [model]);

    useEffect(() => {
        if (model) {
            waitForModel(model).then(() => {
                const same =
                    vocab === model?.config.vocabSize &&
                    context === model?.config.blockSize &&
                    layers === model?.config.nLayer &&
                    embedding === model?.config.nEmbed &&
                    heads === model?.config.nHead;
                setSame(same);
            });
        }
    }, [model, vocab, context, layers, embedding, heads]);

    return (
        <div className={style.container}>
            <div className={style.row}>
                <Button
                    variant="contained"
                    disabled={isSame}
                    onClick={() => {
                        if (model) {
                            console.log('Disposing old model');
                            try {
                                model.dispose();
                            } catch (e) {
                                console.error('Error disposing old model:', e);
                                return undefined;
                            }
                        }
                        const newModel = TeachableLLM.create('char', {
                            nLayer: layers,
                            nEmbed: embedding,
                            vocabSize: vocab,
                            blockSize: context,
                            mlpFactor: 4,
                            nHead: heads,
                        });
                        onModel(newModel);
                    }}
                >
                    Create Model
                </Button>
                <NumberBox
                    value={memory > HIGH_MEMORY_THRESHOLD ? memory * 1024 * 1024 : params}
                    label={memory > HIGH_MEMORY_THRESHOLD ? t('model.memory') : t('model.parameters')}
                    style={{ color: memory > HIGH_MEMORY_THRESHOLD ? 'red' : undefined }}
                />
            </div>
            <div className={style.innerContainer}>
                <NumberInput
                    label="Vocabulary Size"
                    value={vocab}
                    onChange={(e) => setVocab(e)}
                    min={1}
                    max={1000}
                />
                <NumberInput
                    label="Context Window"
                    value={context}
                    onChange={(e) => setContext(e)}
                    min={1}
                    max={2048}
                />
                <NumberInput
                    label="Layers"
                    value={layers}
                    onChange={(e) => setLayers(e)}
                    min={1}
                    max={24}
                />
                <NumberInput
                    label="Heads"
                    value={heads}
                    onChange={(e) => setHeads(e)}
                    min={1}
                    max={16}
                />
                <NumberInput
                    label="Embedding Size"
                    value={embedding}
                    onChange={(e) => setEmbedding(e)}
                    min={1}
                    max={1024}
                    error={
                        validationError === 'nEmbed_divisible_nHead'
                            ? t('validation.nEmbed_divisible_nHead', { heads: 6 })
                            : undefined
                    }
                />
            </div>
        </div>
    );
}
