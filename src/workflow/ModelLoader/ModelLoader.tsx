import { useEffect, useState } from 'react';
import style from './style.module.css';
import { CharTokeniser, TeachableLLM } from '@genai-fi/nanogpt';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import { useTranslation } from 'react-i18next';
import Box from '../../components/BoxTitle/Box';
import ModelMenu from '../LanguageModel/ModelMenu';
import ModelSearch from '../LanguageModel/ModelSearch';
import ModelInfo from '../../components/ModelInfo/ModelInfo';
import InfoPanel from '../TextData/InfoPanel';
import useModelBusy from '../../utilities/useModelBusy';
import useModelLoaded from '../../utilities/useModelLoaded';

interface Props {
    onModel: (model: TeachableLLM) => void;
    model?: TeachableLLM;
}

export default function ModelLoader({ onModel, model }: Props) {
    const { t } = useTranslation();
    const [done, setDone] = useState(false);
    const busy = useModelBusy(model);
    const ready = useModelLoaded(model);
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        if (model) {
            setDone(false);
            const h = () => {
                setDone(true);
            };
            model.on('loaded', h);

            const eh = (error: unknown) => {
                console.error('Error loading model:', error);
            };
            model.on('error', eh);

            return () => {
                model.off('loaded', h);
                model.off('error', eh);
            };
        }
    }, [model]);

    return (
        <Box
            widget="model"
            style={{ maxWidth: '330px' }}
            active={done}
            disabled={busy}
        >
            <div className={style.container}>
                <BoxTitle
                    title={t('model.title')}
                    status={done ? 'done' : !done && !!model ? 'busy' : 'waiting'}
                ></BoxTitle>
                <ModelMenu
                    onCreate={() => console.log('Create model')}
                    onUpload={() => console.log('Upload model')}
                    onSearch={() => setShowSearch(true)}
                />
                <div className={style.contentBox}>
                    <InfoPanel
                        show={!model}
                        severity="info"
                        message={t('model.modelHint')}
                    />
                    {model && ready && (
                        <>
                            <h2 className={style.modelName}>{model.meta.name || 'Unnamed Model'}</h2>
                            <ModelInfo
                                config={model.config}
                                tokeniser={model.tokeniser instanceof CharTokeniser ? 'char' : 'bpe'}
                                showTokens
                                showLayers
                                showContextSize
                            />
                        </>
                    )}
                </div>
                {showSearch && (
                    <ModelSearch
                        onClose={() => setShowSearch(false)}
                        onModel={onModel}
                        model={model}
                        selectedSet={model && model.meta.id ? new Set([model.meta.id]) : undefined}
                    />
                )}
            </div>
        </Box>
    );
}
