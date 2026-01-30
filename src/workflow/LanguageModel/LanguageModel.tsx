import { TeachableLLM } from '@genai-fi/nanogpt';
import ModelVisualisation from '../../components/ModelVisualisation/ModelVisualisation';
import { useTranslation } from 'react-i18next';
import { uiShowVisualisation } from '../../state/uiState';
import { useAtom, useAtomValue } from 'jotai';
import style from './style.module.css';
import Box from '../../components/BoxTitle/Box';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import ModelMenu from './ModelMenu';
import { useCallback, useEffect, useRef, useState } from 'react';
import useModelBusy from '../../utilities/useModelBusy';
import { saveAs } from 'file-saver';
import Tools from './Tools';
import logger from '../../utilities/logger';
import waitModelLoaded from '../../utilities/waitModelLoaded';
import { modelAtom } from '../../state/model';
import SearchUntrained from './SearchUntrained';
// import useModelLoaded from '../../utilities/useModelLoaded';

export default function LanguageModel() {
    const { t } = useTranslation();
    const [model, setModel] = useAtom(modelAtom);
    const showVisualisation = useAtomValue(uiShowVisualisation);
    const [showSearch, setShowSearch] = useState(false);
    const [showTools, setShowTools] = useState(false);
    const [done, setDone] = useState(false);
    const busy = useModelBusy(model ?? undefined);
    const [saving, setSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    // Prevent double loading issues
    const modelRef = useRef<TeachableLLM | undefined>(model);
    modelRef.current = model;

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
            setModel(model);
            waitModelLoaded(model).then(() => {
                setIsLoading(false);
            });
        },
        [setModel]
    );

    const modelBusy = busy || isLoading || saving;

    useEffect(() => {
        if (model) {
            setDone(false);
            const h = () => {
                logger.log({ action: 'model_loaded', model: model.meta });
                setDone(true);
            };
            model.on('loaded', h);

            const eh = (error: unknown) => {
                console.error('Error loading model:', error);
                logger.error({ errorString: String(error), userAgent: navigator.userAgent });
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
            widget="thread"
            active={done}
            disabled={busy}
            className={style.modelThread}
            fullWidth
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
                <SearchUntrained
                    onClose={() => setShowSearch(false)}
                    onModel={setModel}
                    model={model ?? undefined}
                />
            )}
            {showTools && <Tools onClose={() => setShowTools(false)} />}
            <div className={style.container}>
                <BoxTitle
                    title={t('model.title')}
                    status={isLoading ? 'busy' : model ? 'done' : 'disabled'}
                    placeholder={t('model.languageModel')}
                    dark
                />
                {showVisualisation && <ModelVisualisation model={model ?? undefined} />}
                <ModelMenu
                    onUpload={modelBusy ? undefined : () => fileRef.current?.click()}
                    onSearch={modelBusy ? undefined : () => setShowSearch(true)}
                    onDownload={!modelBusy && model ? () => doSave(model?.meta.name || 'model') : undefined}
                    onTools={modelBusy ? undefined : () => setShowTools(true)}
                />
            </div>
        </Box>
    );
}
