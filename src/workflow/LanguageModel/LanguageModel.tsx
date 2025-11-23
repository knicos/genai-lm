import { TeachableLLM, waitForModel } from '@genai-fi/nanogpt';
import ModelVisualisation from '../../components/ModelVisualisation/ModelVisualisation';
import { useTranslation } from 'react-i18next';
import { uiShowVisualisation } from '../../state/uiState';
import { useAtomValue } from 'jotai';
import style from './style.module.css';
import Box from '../../components/BoxTitle/Box';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import ModelMenu from './ModelMenu';
import { useCallback, useEffect, useRef, useState } from 'react';
import ModelSearch from './ModelSearch';
import useModelBusy from '../../utilities/useModelBusy';
import { saveAs } from 'file-saver';
// import useModelLoaded from '../../utilities/useModelLoaded';

interface Props {
    model?: TeachableLLM;
    onModel: (model: TeachableLLM) => void;
}

export default function LanguageModel({ model, onModel }: Props) {
    const { t } = useTranslation();
    const showVisualisation = useAtomValue(uiShowVisualisation);
    const [showSearch, setShowSearch] = useState(false);
    const [done, setDone] = useState(false);
    const busy = useModelBusy(model);
    const [saving, setSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState(model?.meta.name || '');
    // const ready = useModelLoaded(model);

    const doSave = useCallback(
        (name: string) => {
            setSaving(true);
            model
                ?.saveModel({ name })
                .then((blob) => {
                    setSaving(false);
                    saveAs(blob, `${name}.zip`);
                })
                .catch((e) => {
                    console.error('Error saving model:', e);
                });
        },
        [model]
    );

    const openFile = useCallback(
        (file: File) => {
            setIsLoading(true);
            const model = TeachableLLM.loadModel(file);
            model.meta.trained = true;
            onModel(model);
            waitForModel(model).then(() => {
                setIsLoading(false);
            });
        },
        [onModel]
    );

    const modelBusy = busy || isLoading || saving;

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

            setTitle(model.meta.name || '');

            return () => {
                model.off('loaded', h);
                model.off('error', eh);
            };
        }
    }, [model]);

    const updateModelTitle = useCallback(
        (title: string) => {
            if (model) {
                model.meta.name = title;
            }
            setTitle(title);
        },
        [model]
    );

    return (
        <Box
            widget="thread"
            active={done}
            disabled={busy}
            className={style.modelThread}
        >
            <input
                type="file"
                accept=".zip"
                ref={fileRef}
                style={{ display: 'none' }}
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        const file = e.target.files[0];
                        openFile(file);
                    }
                }}
            />
            {showSearch && (
                <ModelSearch
                    onClose={() => setShowSearch(false)}
                    onModel={onModel}
                    model={model}
                    selectedSet={model && model.meta.id ? new Set([model.meta.id]) : undefined}
                />
            )}
            <div className={style.container}>
                <BoxTitle
                    title={title}
                    status={isLoading ? 'busy' : model ? 'done' : 'disabled'}
                    style={{ height: '5rem' }}
                    setTitle={updateModelTitle}
                    placeholder={t('model.languageModel')}
                    dark
                    button={
                        <ModelMenu
                            disableInspect={!model}
                            onUpload={modelBusy ? undefined : () => fileRef.current?.click()}
                            onSearch={modelBusy ? undefined : () => setShowSearch(true)}
                            onDownload={!modelBusy && model ? () => doSave(model?.meta.name || 'model') : undefined}
                        />
                    }
                />
                {showVisualisation && <ModelVisualisation model={model} />}
            </div>
        </Box>
    );
}
