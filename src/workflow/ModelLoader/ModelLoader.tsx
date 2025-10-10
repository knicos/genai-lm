import { useEffect, useState } from 'react';
import style from './style.module.css';
import { CharTokeniser, TeachableLLM } from '@genai-fi/nanogpt';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import { useTranslation } from 'react-i18next';
import Box from '../../components/BoxTitle/Box';
import useModelStatus from '../../utilities/useModelStatus';
import ModelMenu from './ModelMenu';
import ModelSearch from './ModelSearch';
import ModelInfo from '../../components/ModelInfo/ModelInfo';
import InfoPanel from '../TextData/InfoPanel';

interface Props {
    onModel: (model: TeachableLLM) => void;
    model?: TeachableLLM;
}

export default function ModelLoader({ onModel, model }: Props) {
    const { t } = useTranslation();
    const [done, setDone] = useState(false);
    const status = useModelStatus(model);
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        if (model) {
            setDone(false);
            const h = () => {
                setDone(true);
            };
            model.on('loaded', h);
            return () => {
                model.off('loaded', h);
            };
        }
    }, [model]);

    return (
        <Box
            widget="model"
            style={{ maxWidth: '330px' }}
            active={done}
            disabled={status === 'training'}
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
                    {model && status !== 'loading' && (
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
