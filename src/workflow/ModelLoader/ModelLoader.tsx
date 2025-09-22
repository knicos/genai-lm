import { useEffect, useState } from 'react';
import style from './style.module.css';
import { TeachableLLM } from '@genai-fi/nanogpt';
import manifest from './manifest.json';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import ModelList, { ManifestItem } from './ModelList';
import { Tab, Tabs } from '@mui/material';
import CustomModel from './CustomModel';
import { useTranslation } from 'react-i18next';
import Box from '../../components/BoxTitle/Box';
import useModelStatus from '../../utilities/useModelStatus';

interface Props {
    onModel: (model: TeachableLLM) => void;
    model?: TeachableLLM;
}

export default function ModelLoader({ onModel, model }: Props) {
    const { t } = useTranslation();
    const [done, setDone] = useState(false);
    const [tab, setTab] = useState(0);
    const status = useModelStatus(model);

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
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                >
                    <Tab label={t('model.trained')} />
                    <Tab label={t('model.untrained')} />
                    <Tab label={t('model.custom')} />
                </Tabs>
                {tab === 0 && (
                    <ModelList
                        manifest={(manifest as ManifestItem[]).filter((m) => m.trained)}
                        model={model}
                        onModel={onModel}
                    />
                )}
                {tab === 1 && (
                    <ModelList
                        manifest={(manifest as ManifestItem[]).filter((m) => !m.trained)}
                        model={model}
                        onModel={onModel}
                    />
                )}
                {tab === 2 && (
                    <CustomModel
                        model={model}
                        onModel={onModel}
                    />
                )}
            </div>
        </Box>
    );
}
