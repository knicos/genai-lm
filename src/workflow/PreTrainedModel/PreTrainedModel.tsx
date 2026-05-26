import { TeachableLLM } from '@genai-fi/nanogpt';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import style from './style.module.css';
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
import BoxStandalone from '../../components/BoxTitle/BoxStandalone';
import { IconButton, Popover } from '@mui/material';
import ModelName from './ModelName';
import ModelStage from './ModelStage';
// import useModelLoaded from '../../utilities/useModelLoaded';
import MoreVertIcon from '@mui/icons-material/MoreVert';

export default function PreTrainedModel() {
    const { t } = useTranslation();
    const [model, setModel] = useAtom(modelAtom);
    const [showSearch, setShowSearch] = useState(false);
    const [done, setDone] = useState(false);
    const busy = useModelBusy(model ?? undefined);
    const [saving, setSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState(model?.meta.name || '');
    const [hideMenu, setHideMenu] = useState(true);
    const anchorRef = useRef<HTMLDivElement>(null);

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
            style={{ borderRadius: '20px' }}
            placement="top"
        >
            <BoxStandalone
                disabled={busy}
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
                    <SearchPretrained
                        onClose={() => setShowSearch(false)}
                        onModel={setModel}
                        model={model ?? undefined}
                    />
                )}
                <div
                    className={style.container}
                    ref={anchorRef}
                >
                    <div
                        className={style.icon}
                        onClick={() => setHideMenu((h) => !h)}
                    >
                        <ModelIcon model={model ?? undefined} />
                    </div>
                    <div className={style.nameStatusGroup}>
                        <ModelName
                            title={title}
                            setTitle={updateModelTitle}
                            style={{ borderBottom: 'none', backgroundColor: '#945fbf' }}
                            placeholder={t('model.languageModel')}
                        />
                        <ModelStage model={model ?? null} />
                    </div>
                    <IconButton
                        color="inherit"
                        onClick={() => setHideMenu((h) => !h)}
                    >
                        <MoreVertIcon
                            color="inherit"
                            fontSize="large"
                        />
                    </IconButton>
                    <Popover
                        open={!hideMenu}
                        onClose={() => setHideMenu(true)}
                        anchorEl={anchorRef.current}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                        }}
                        transformOrigin={{
                            vertical: 'bottom',
                            horizontal: 'center',
                        }}
                        className={style.popover}
                    >
                        <ModelMenu
                            disabled={modelBusy}
                            onUpload={() => {
                                fileRef.current?.click();
                                setHideMenu(true);
                            }}
                            onSearch={() => {
                                setShowSearch(true);
                                setHideMenu(true);
                            }}
                            onDownload={
                                model
                                    ? () => {
                                          doSave(model?.meta.name || 'model');
                                          setHideMenu(true);
                                      }
                                    : undefined
                            }
                        />
                    </Popover>
                </div>
            </BoxStandalone>
        </Help>
    );
}
