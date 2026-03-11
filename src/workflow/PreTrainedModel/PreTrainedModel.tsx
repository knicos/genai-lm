import { TeachableLLM } from '@genai-fi/nanogpt';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import style from './style.module.css';
import Box from '../../components/BoxTitle/Box';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import ModelMenu from './ModelMenu';
import { useCallback, useEffect, useRef, useState } from 'react';
import useModelBusy from '../../hooks/useModelBusy';
import { saveAs } from 'file-saver';
import logger from '../../utilities/logger';
import waitModelLoaded from '../../utilities/waitModelLoaded';
import { modelAtom } from '../../state/model';
import SearchPretrained from './SearchPretrained';
import ModelIcon from '../../icons/ModelIcon';
import Help from '../../components/Help/Help';
// import useModelLoaded from '../../utilities/useModelLoaded';

interface Props {
    widget?: string;
    hideMenu?: boolean;
}

export default function PreTrainedModel({ widget, hideMenu }: Props) {
    const { t } = useTranslation();
    const [model, setModel] = useAtom(modelAtom);
    const [showSearch, setShowSearch] = useState(false);
    const [done, setDone] = useState(false);
    const busy = useModelBusy(model ?? undefined);
    const [saving, setSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState(model?.meta.name || '');

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
            setModel((old) => {
                if (old) {
                    old.dispose();
                }
                const model = TeachableLLM.loadModel(file);
                model.meta.trained = true;
                waitModelLoaded(model).then(() => {
                    setIsLoading(false);
                });
                return model;
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
        <Help
            message={t('model.help')}
            active={done}
            widget={widget ?? 'pretrained'}
            style={{ borderRadius: '20px' }}
            placement="top"
        >
            <Box
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
                    <SearchPretrained
                        onClose={() => setShowSearch(false)}
                        onModel={setModel}
                        model={model ?? undefined}
                    />
                )}
                <div className={style.container}>
                    <BoxTitle
                        title={title}
                        setTitle={updateModelTitle}
                        startIcon={
                            <div className={style.icon}>
                                <ModelIcon />
                            </div>
                        }
                        style={{ height: '60px', borderBottom: 'none', backgroundColor: '#945fbf' }}
                        placeholder={t('model.languageModel')}
                        dark
                    />
                    {!hideMenu && (
                        <ModelMenu
                            disabled={modelBusy}
                            onUpload={() => fileRef.current?.click()}
                            onSearch={() => setShowSearch(true)}
                            onDownload={model ? () => doSave(model?.meta.name || 'model') : undefined}
                        />
                    )}
                </div>
            </Box>
        </Help>
    );
}
