import { Spinner } from '@genai-fi/base';
import CardView from '../CardView/CardView';
import DownloadProgress from '../DownloadProgress/DownloadProgress';
import {
    Checkbox,
    FormControl,
    FormControlLabel,
    IconButton,
    MenuItem,
    Select,
    SelectChangeEvent,
} from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { ExtendedConfig, modelDownloadAtom } from '../../state/model';
import { TeachableLLM } from '@genai-fi/nanogpt';
import { ModelCardItem } from '../ModelCard/type';
import { RowSet } from '../CardRow/CardRow';
import { configMatch } from './manifest';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import Downloader from '../../utilities/downloader';
import style from './style.module.css';
import CloseIcon from '@mui/icons-material/Close';
import ModelCard from '../ModelCard/ModelCard';

interface Props {
    model?: TeachableLLM;
    onModel?: (updater: (old: TeachableLLM | null) => TeachableLLM) => void;
    config?: ExtendedConfig;
    onConfig?: (config: ExtendedConfig) => void;
    dataRows: RowSet<ModelCardItem>[];
    langs: { code: string; name: string }[];
    setLang: (lang: string) => void;
    lang: string;
    limitToModelArchitecture?: boolean;
    onClose?: () => void;
}

export default function SearchContent({
    model,
    onModel,
    config,
    onConfig,
    dataRows,
    langs,
    setLang,
    lang,
    limitToModelArchitecture,
    onClose,
}: Props) {
    const { t } = useTranslation();
    const [download, setDownload] = useAtom(modelDownloadAtom);
    const [includeAll, setIncludeAll] = useState(true);
    const selectedSet =
        model && model.meta.id ? new Set([model.meta.id]) : config && config.id ? new Set([config.id]) : undefined;

    const filteredRows = useMemo(
        () =>
            includeAll || !limitToModelArchitecture
                ? dataRows
                : dataRows.map((row) => {
                      const newCards = row.cards.filter((card) => {
                          if (!model || !model.loaded || !card.config) return true;
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
                setDownload(downloader);
                downloader.start();
            } else if (!card.url && card.config) {
                if (onModel) {
                    const newModel = TeachableLLM.create(card.tokeniser || 'char', card.config);
                    newModel.meta.id = card.id;
                    newModel.meta.name = card.name;
                    newModel.meta.trained = false;
                    onModel((old) => {
                        if (old) {
                            old.dispose();
                        }
                        return newModel;
                    });
                } else if (onConfig) {
                    onConfig({ ...card.config, id: card.id });
                }
            }
        },
        [model, onModel, onConfig, setDownload]
    );

    return (
        <>
            <div className={style.headerBar}>
                {langs.length > 0 && !download && (
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

                {download && <DownloadProgress downloads={download} />}
                <div style={{ flexGrow: 1 }} />
                {onClose && (
                    <IconButton
                        onClick={() => {
                            onClose();
                        }}
                        aria-label={t('data.close')}
                    >
                        <CloseIcon fontSize="large" />
                    </IconButton>
                )}
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
        </>
    );
}
