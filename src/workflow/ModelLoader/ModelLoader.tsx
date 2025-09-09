import { useEffect, useState } from 'react';
import style from './style.module.css';
import { TeachableLLM } from '@genai-fi/nanogpt';
import manifest from './manifest.json';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import ModelList from './ModelList';
import { Tab, Tabs } from '@mui/material';
import CustomModel from './CustomModel';
import { useTranslation } from 'react-i18next';

interface Props {
    onModel: (model: TeachableLLM) => void;
    model?: TeachableLLM;
}

export default function ModelLoader({ onModel, model }: Props) {
    const { t } = useTranslation();
    const [done, setDone] = useState(false);
    const [tab, setTab] = useState(0);

    useEffect(() => {
        if (model) {
            //onModel(model);
            if (model.ready) {
                setDone(true);
            } else {
                const h = (status: string) => {
                    if (status === 'ready') setDone(true);
                };
                model.on('status', h);
                return () => {
                    model.off('status', h);
                };
            }
            setDone(true);
        }
    }, [model]);

    return (
        <div className={style.container}>
            <BoxTitle
                title={t('model.title')}
                done={done}
                busy={!done && !!model}
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
                    manifest={manifest.filter((m) => m.trained)}
                    model={model}
                    onModel={onModel}
                />
            )}
            {tab === 1 && (
                <ModelList
                    manifest={manifest.filter((m) => !m.trained)}
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
    );
}
