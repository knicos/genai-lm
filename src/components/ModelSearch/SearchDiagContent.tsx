import { Suspense, useCallback, useRef, useState } from 'react';
import { FormControl, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { TeachableLLM } from '@genai-fi/nanogpt';
import { ExtendedConfig, modelAtom, modelManifestLanguage } from '../../state/model';
import style from './style.module.css';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { SortType } from '../../workflow/TextData/TextSearchListing';
import { useAtom, useSetAtom } from 'jotai';
import { Spinner } from '@genai-fi/base';
import { LANGS } from '../AppBar/langs';
import { del } from 'idb-keyval';
import SearchTrained from './SearchTrained';
import SearchUntrained from './SearchUntrained';
import UploadFileIcon from '@mui/icons-material/UploadFile';

interface Props {
    model?: TeachableLLM;
    onModel?: (updater: (old: TeachableLLM | null) => TeachableLLM) => void;
    config?: ExtendedConfig;
    onConfig?: (config: ExtendedConfig) => void;
    onClose?: () => void;
    trained?: boolean;
    allowFileOpen?: boolean;
}

export default function SearchDiagContent({ trained, allowFileOpen, onClose, ...props }: Props) {
    const { t } = useTranslation();
    const [lang, setLang] = useAtom(modelManifestLanguage);
    const [sort, setSort] = useState<SortType>('smallest');
    const fileRef = useRef<HTMLInputElement>(null);
    const setModel = useSetAtom(modelAtom);

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
    return (
        <>
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
            <div className={style.headerBar}>
                <FormControl size="small">
                    <Select
                        aria-label={t('data.language')}
                        value={lang}
                        onChange={(e: SelectChangeEvent) => setLang(e.target.value)}
                    >
                        {LANGS.map((l) => (
                            <MenuItem
                                key={l.name}
                                value={l.name.split('-')[0]}
                            >
                                {l.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl
                    size="small"
                    sx={{ marginLeft: 2, minWidth: 120 }}
                >
                    <InputLabel htmlFor="sort-select">{t('data.sort')}</InputLabel>
                    <Select
                        id="sort-select"
                        aria-label={t('data.sort')}
                        value={sort}
                        label={t('data.sort')}
                        onChange={(e: SelectChangeEvent) => setSort(e.target.value as SortType)}
                    >
                        <MenuItem value={'smallest'}>{t('data.sortSmallest')}</MenuItem>
                        <MenuItem value={'largest'}>{t('data.sortLargest')}</MenuItem>
                    </Select>
                </FormControl>
                <div style={{ flexGrow: 1 }} />
                {allowFileOpen && (
                    <IconButton
                        onClick={() => fileRef.current?.click()}
                        aria-label={t('data.upload')}
                        color="secondary"
                    >
                        <UploadFileIcon fontSize="large" />
                    </IconButton>
                )}
                {onClose && (
                    <IconButton
                        onClick={onClose}
                        aria-label={t('data.close')}
                    >
                        <CloseIcon fontSize="large" />
                    </IconButton>
                )}
            </div>
            <Suspense
                fallback={
                    <div className={style.spinner}>
                        <Spinner />
                    </div>
                }
            >
                {trained ? <SearchTrained {...props} /> : <SearchUntrained {...props} />}
            </Suspense>
        </>
    );
}
