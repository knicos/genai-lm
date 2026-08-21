import { useAtomValue } from 'jotai';
import CardView from '../../components/CardView/CardView';
import DataCard from '../../components/DataCard/DataCard';
import { dataManifest, DataManifestEntry } from '../../state/data';
import Downloader from '../../utilities/downloader';
import { useMemo } from 'react';
import { Alert } from '@mui/material';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';

export type SortType = 'smallest' | 'largest' | 'simple' | 'complex';

interface Props {
    onDownload(downloader: Downloader): void;
    selectedSet?: Set<string>;
    sort: SortType;
}

function complexityValue(complexity: string) {
    switch (complexity) {
        case 'low':
            return 0;
        case 'medium':
            return 1;
        case 'high':
            return 2;
        default:
            return 0;
    }
}

export default function TextSearchListing({ onDownload, selectedSet, sort }: Props) {
    const { t } = useTranslation();
    const dataRows = useAtomValue(dataManifest);

    const sortedData = useMemo(() => {
        if (!dataRows) return null;
        const sorted = dataRows.map((row) => ({
            ...row,
            cards: [...row.cards].sort((a, b) => {
                switch (sort) {
                    case 'smallest':
                        return a.size - b.size;
                    case 'largest':
                        return b.size - a.size;
                    case 'simple':
                        return complexityValue(a.complexity) - complexityValue(b.complexity);
                    case 'complex':
                        return complexityValue(b.complexity) - complexityValue(a.complexity);
                    default:
                        return 0;
                }
            }),
        }));

        // Now sort the catergories themselves based on the first card in each category
        sorted.sort((a, b) => {
            const aFirst = a.cards[0];
            const bFirst = b.cards[0];
            if (!aFirst || !bFirst) return 0; // If either category is empty, consider them equal
            switch (sort) {
                case 'smallest':
                    return aFirst.size - bFirst.size;
                case 'largest':
                    return bFirst.size - aFirst.size;
                case 'simple':
                    return complexityValue(aFirst.complexity) - complexityValue(bFirst.complexity);
                case 'complex':
                    return complexityValue(bFirst.complexity) - complexityValue(aFirst.complexity);
                default:
                    return 0;
            }
        });

        return sorted;
    }, [dataRows, sort]);

    return sortedData === null ? (
        <div className={style.errorBox}>
            <Alert severity="error">{t('data.errors.libraryError')}</Alert>
        </div>
    ) : (
        <CardView<DataManifestEntry, Downloader>
            CardComponent={DataCard}
            data={sortedData}
            onSelect={(_, downloader) => {
                if (downloader) onDownload(downloader);
            }}
            selectedSet={selectedSet}
        />
    );
}
