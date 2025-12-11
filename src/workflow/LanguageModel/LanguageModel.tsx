import { TeachableLLM } from '@genai-fi/nanogpt';
import ModelVisualisation from '../../components/ModelVisualisation/ModelVisualisation';
import { useTranslation } from 'react-i18next';
import { uiShowVisualisation } from '../../state/uiState';
import { useAtomValue } from 'jotai';
import style from './style.module.css';
import Box from '../../components/BoxTitle/Box';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import ModelMenu from './ModelMenu';
import { useCallback, useEffect, useRef, useState } from 'react';
import ModelSearch, { MANIFEST_URL, ModelManifest } from './ModelSearch';
import useModelBusy from '../../utilities/useModelBusy';
import { saveAs } from 'file-saver';
import Tools from './Tools';
import { useParams, useSearchParams } from 'react-router-dom';
import logger from '../../utilities/logger';
import waitModelLoaded from '../../utilities/waitModelLoaded';
// import useModelLoaded from '../../utilities/useModelLoaded';

interface Props {
    model?: TeachableLLM;
    onModel: (model: TeachableLLM) => void;
}

export default function LanguageModel({ model, onModel }: Props) {
    const { t } = useTranslation();
    const showVisualisation = useAtomValue(uiShowVisualisation);
    const [showSearch, setShowSearch] = useState(false);
    const [showTools, setShowTools] = useState(false);
    const [done, setDone] = useState(false);
    const busy = useModelBusy(model);
    const [saving, setSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState(model?.meta.name || '');
    const [searchParams] = useSearchParams();
    const routerParams = useParams();

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
            onModel(model);
            waitModelLoaded(model).then(() => {
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
                logger.log({ action: 'model_loaded', model: model.meta });
                setDone(true);
            };
            model.on('loaded', h);

            const eh = (error: unknown) => {
                console.error('Error loading model:', error);
                logger.error({ errorString: String(error), userAgent: navigator.userAgent });
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

    const loadModelById = useCallback(
        (id: string) => {
            console.log('Loading model by id:', id);
            setIsLoading(true);
            fetch(MANIFEST_URL)
                .then((res) => res.json())
                .then((data: ModelManifest) => {
                    const card = data.models.find((m) => m.id === id);
                    if (!card) {
                        console.error('Model not found in manifest:', id);
                        setIsLoading(false);
                        return;
                    }

                    if (!card.url) {
                        if (modelRef.current) {
                            //modelRef.current.dispose();
                            setIsLoading(false);
                            return;
                        }
                        const newModel = TeachableLLM.create(card.tokeniser || 'char', card.config);
                        modelRef.current = newModel;
                        newModel.meta.id = card.id;
                        newModel.meta.name = t('model.defaultName');
                        newModel.meta.trained = false;
                        onModel(newModel);
                        waitModelLoaded(newModel)
                            .then(() => {
                                setIsLoading(false);
                            })
                            .catch((e) => {
                                setIsLoading(false);
                                console.error('Failed to wait for model', e);
                            });
                    } else {
                        fetch(card.url)
                            .then((res) => res.blob())
                            .then((blob) => {
                                if (modelRef.current) {
                                    //modelRef.current.dispose();
                                    setIsLoading(false);
                                    return;
                                }
                                const file = new File([blob], `${card.id}.zip`, { type: 'application/zip' });
                                const newModel = TeachableLLM.loadModel(file);
                                modelRef.current = newModel;
                                newModel.meta.id = card.id;
                                newModel.meta.name = card.name;
                                newModel.meta.trained = card.trained || true;
                                onModel(newModel);
                                waitModelLoaded(newModel)
                                    .then(() => {
                                        setIsLoading(false);
                                    })
                                    .catch((e) => {
                                        setIsLoading(false);
                                        console.error('Failed to wait for model', e);
                                    });
                            })
                            .catch((e) => {
                                setIsLoading(false);
                                console.error('Failed to fetch model file', e);
                            });
                    }
                })
                .catch((e) => {
                    setIsLoading(false);
                    console.error('Failed to load model manifest', e);
                });
        },
        [onModel, t]
    );

    const modelParam = searchParams.get('model');

    useEffect(() => {
        // Use provided model id from URL params
        if (modelParam) {
            loadModelById(modelParam);
            // Load untrained model for pretrain workflow
        } else if (routerParams.flow === 'pretrain') {
            loadModelById('untrained-small');
        }
    }, [modelParam, loadModelById, routerParams.flow]);

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
            {showTools && <Tools onClose={() => setShowTools(false)} />}
            <div className={style.container}>
                <BoxTitle
                    title={title}
                    status={isLoading ? 'busy' : model ? 'done' : 'disabled'}
                    style={{ height: '60px', borderBottom: 'none' }}
                    setTitle={updateModelTitle}
                    placeholder={t('model.languageModel')}
                    dark
                    button={
                        <ModelMenu
                            onUpload={modelBusy ? undefined : () => fileRef.current?.click()}
                            onSearch={modelBusy ? undefined : () => setShowSearch(true)}
                            onDownload={!modelBusy && model ? () => doSave(model?.meta.name || 'model') : undefined}
                            onTools={modelBusy ? undefined : () => setShowTools(true)}
                        />
                    }
                />
                {showVisualisation && <ModelVisualisation model={model} />}
            </div>
        </Box>
    );
}
