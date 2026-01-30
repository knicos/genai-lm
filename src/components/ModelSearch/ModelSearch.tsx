import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Checkbox,
    Dialog,
    DialogContent,
    FormControl,
    FormControlLabel,
    IconButton,
    MenuItem,
    Select,
    SelectChangeEvent,
} from '@mui/material';
import style from './style.module.css';
import CloseIcon from '@mui/icons-material/Close';
import { TeachableLLM } from '@genai-fi/nanogpt';
import CardView from '../CardView/CardView';
import ModelCard from '../ModelCard/ModelCard';
import { RowSet } from '../CardRow/CardRow';
import { ModelCardItem } from '../ModelCard/type';
import Downloader from '../../utilities/downloader';
import DownloadProgress from '../DownloadProgress/DownloadProgress';
import { Spinner } from '@genai-fi/base';
import { useAtom } from 'jotai';
import { downloadsAtom } from '../../state/data';
import { configMatch } from './manifest';

export const MANIFEST_URL = 'https://store.gen-ai.fi/llm/modelManifest.json';

interface Props {
    model?: TeachableLLM;
    onModel(model: TeachableLLM): void;
    onClose: () => void;
    dataRows: RowSet<ModelCardItem>[];
    langs: { code: string; name: string }[];
    setLang: (lang: string) => void;
    lang: string;
    limitToModelArchitecture?: boolean;
}

export default function ModelSearch({
    model,
    onModel,
    onClose,
    dataRows,
    langs,
    setLang,
    lang,
    limitToModelArchitecture,
}: Props) {
    const { t } = useTranslation();
    const [downloads, setDownloads] = useAtom(downloadsAtom);
    const [open, setOpen] = useState(true);
    const [includeAll, setIncludeAll] = useState(false);

    const selectedSet = model && model.meta.id ? new Set([model.meta.id]) : undefined;

    const filteredRows = useMemo(
        () =>
            includeAll || !limitToModelArchitecture
                ? dataRows
                : dataRows.map((row) => {
                      const newCards = row.cards.filter((card) => {
                          if (!model || !model.config || !card.config) return true;
                          return configMatch(card.config, model.config);
                      });
                      if (newCards.length === 0) {
                          newCards.push({
                              id: 'none',
                              name: t('model.noModelsFound'),
                              trained: false,
                              parameters: 0,
                          });
                      }
                      return {
                          ...row,
                          cards: newCards,
                      };
                  }),
        [dataRows, model, includeAll, limitToModelArchitecture, t]
    );

    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => {
                onClose();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [open, onClose]);

    const handleSelect = useCallback(
        (card: ModelCardItem, downloader?: Downloader) => {
            if (model) {
                console.log('Disposing old model');
                try {
                    model.dispose();
                } catch (e) {
                    console.error('Error disposing old model:', e);
                    return;
                }
            }
            if (downloader) {
                setDownloads((prev) => [...prev, downloader]);
                downloader.on('end', (file: File) => {
                    const newModel = TeachableLLM.loadModel(file);
                    newModel.meta.id = card.id;
                    newModel.meta.name = card.name;
                    newModel.meta.trained = card.trained || true;
                    onModel(newModel);
                    setDownloads((prev) => prev.filter((d) => d !== downloader));
                });
                downloader.on('error', (error) => {
                    console.error('Download error:', error);
                    setDownloads((prev) => prev.filter((d) => d !== downloader));
                });
                downloader.on('cancel', () => {
                    setDownloads((prev) => prev.filter((d) => d !== downloader));
                });
            } else if (!card.url) {
                const newModel = TeachableLLM.create(card.tokeniser || 'char', card.config);
                newModel.meta.id = card.id;
                newModel.meta.name = card.name;
                newModel.meta.trained = false;
                onModel(newModel);
            }
        },
        [model, onModel, setDownloads]
    );

    return (
        <Dialog
            open={open}
            onClose={() => setOpen(false)}
            maxWidth="lg"
            fullWidth
            sx={{ '& .MuiPaper-root': { margin: '0', borderRadius: '0' } }}
        >
            <DialogContent sx={{ padding: '0' }}>
                <div className={style.headerBar}>
                    {langs.length > 0 && downloads.length === 0 && (
                        <FormControl size="small">
                            <Select
                                aria-label={t('data.language')}
                                value={lang}
                                onChange={(e: SelectChangeEvent) => setLang(e.target.value)}
                            >
                                {langs.map((l) => (
                                    <MenuItem
                                        key={l.code}
                                        value={l.code}
                                    >
                                        {l.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    {limitToModelArchitecture && (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={includeAll}
                                    onChange={(_, checked) => setIncludeAll(checked)}
                                />
                            }
                            label={t('model.includeAll')}
                        />
                    )}

                    <DownloadProgress downloads={downloads} />
                    <div style={{ flexGrow: 1 }} />
                    <IconButton
                        onClick={() => setOpen(false)}
                        aria-label={t('data.close')}
                    >
                        <CloseIcon fontSize="large" />
                    </IconButton>
                </div>
                {dataRows.length === 0 && (
                    <div className={style.spinner}>
                        <Spinner />
                    </div>
                )}
                <CardView
                    data={filteredRows}
                    onSelect={handleSelect}
                    selectedSet={selectedSet}
                    CardComponent={ModelCard}
                />
            </DialogContent>
        </Dialog>
    );
}
