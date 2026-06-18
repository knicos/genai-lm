import { TeachableLLM } from '@genai-fi/nanogpt';
import { useTranslation } from 'react-i18next';
import { useAtom, useAtomValue } from 'jotai';
import style from './style.module.css';
import ModelMenu from './ModelMenu';
import { useCallback, useEffect, useRef, useState } from 'react';
import useModelBusy from '../../hooks/useModelBusy';
import { saveAs } from 'file-saver';
import logger from '../../utilities/logger';
import { modelAtom, modelDownloadAtom } from '../../state/model';
import ModelIcon from '../../icons/ModelIcon';
import Help from '../../components/Help/Help';
import BoxStandalone from '../../components/BoxTitle/BoxStandalone';
import ModelName from './ModelName';
import ModelStage from './ModelStage';
import useModelStatus from '../../hooks/useModelStatus';
import { Spinner } from '@genai-fi/base';
import { del } from 'idb-keyval';
import ModelSearch from '../../components/ModelSearch/ModelSearch';

export default function ModelState() {
    const { t } = useTranslation();
    const [model, setModel] = useAtom(modelAtom);
    const status = useModelStatus(model ?? undefined);
    const [showSearch, setShowSearch] = useState(false);
    const [done, setDone] = useState(false);
    const busy = useModelBusy(model ?? undefined);
    const [saving, setSaving] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState(model?.meta.name || '');
    const anchorRef = useRef<HTMLDivElement>(null);
    const downloader = useAtomValue(modelDownloadAtom);

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
            //setIsLoading(true);
            setModel((old) => {
                if (old) {
                    old.dispose();
                }
                del('model_checkpoint');
                const model = TeachableLLM.loadModel(file);
                model.meta.trained = true;
                /*waitModelLoaded(model).then(() => {
                    setIsLoading(false);
                });*/
                return model;
            });
        },
        [setModel]
    );

    const modelBusy = busy || saving;

    useEffect(() => {
        if (model) {
            setDone(false);
            const h = () => {
                logger.log({ action: 'model_loaded', model: model.meta });
                setDone(true);
                setTitle(model.meta.name || '');
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

    const updateModelTitle = useCallback(
        (title: string) => {
            if (model) {
                model.meta.name = title;
            }
            setTitle(title);
        },
        [model]
    );

    const spin = (model && status !== 'ready' && status !== 'awaitingTokens') || downloader;

    return (
        <Help
            message={t('model.help')}
            style={{ borderRadius: '20px' }}
            placement="top"
        >
            <BoxStandalone
                className={style.modelThread}
                active={done}
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
                        trained={true}
                        onClose={() => setShowSearch(false)}
                        onModel={setModel}
                        model={model ?? undefined}
                    />
                )}
                <div
                    className={style.container}
                    ref={anchorRef}
                >
                    <div className={style.icon}>
                        {!spin && <ModelIcon model={model ?? undefined} />}
                        {spin && (
                            <div className={style.loadingIcon}>
                                <Spinner
                                    size="small"
                                    color="dark"
                                />
                            </div>
                        )}
                    </div>
                    {!spin && model && (
                        <div className={style.nameStatusGroup}>
                            <ModelName
                                title={title}
                                setTitle={updateModelTitle}
                                style={{ borderBottom: 'none', backgroundColor: '#945fbf' }}
                                placeholder={t('model.languageModel')}
                            />
                            <ModelStage model={model ?? null} />
                        </div>
                    )}
                    {downloader && <div className={style.statusMessage}>{t('model.downloading')}</div>}
                    {model && status === 'loading' && !downloader && (
                        <div className={style.statusMessage}>{t('model.loading')}</div>
                    )}
                    {!model && !downloader && <div className={style.statusMessage}>{t('model.noModel')}</div>}
                    {status === 'training' && !downloader && (
                        <div className={style.statusMessage}>{t('model.training')}</div>
                    )}
                    {(status === 'busy' || status == 'warmup') && !downloader && (
                        <div className={style.statusMessage}>{t('model.busy')}</div>
                    )}
                    {status === 'error' && !downloader && <div className={style.statusMessage}>{t('model.error')}</div>}

                    <ModelMenu
                        disabled={modelBusy}
                        onUpload={() => {
                            fileRef.current?.click();
                        }}
                        onSearch={() => {
                            setShowSearch(true);
                        }}
                        onDownload={
                            model
                                ? () => {
                                      doSave(model?.meta.name || 'model');
                                  }
                                : undefined
                        }
                    />
                </div>
            </BoxStandalone>
        </Help>
    );
}
