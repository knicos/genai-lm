import CardView from '../CardView/CardView';
import { useCallback, useMemo } from 'react';
import { ExtendedConfig, modelDownloadAtom, ModelManifestEntry, trainedModelManifest } from '../../state/model';
import { TeachableLLM } from '@genai-fi/nanogpt';
import { useAtomValue, useSetAtom } from 'jotai';
import Downloader from '../../utilities/downloader';
import ModelCard from '../ModelCard/ModelCard';

interface Props {
    model?: TeachableLLM;
    onModel?: (updater: (old: TeachableLLM | null) => TeachableLLM) => void;
    config?: ExtendedConfig;
    onConfig?: (config: ExtendedConfig) => void;
}

export default function SearchContent({ model, config }: Props) {
    const dataRows = useAtomValue(trainedModelManifest);
    const setDownload = useSetAtom(modelDownloadAtom);
    const selectedSet =
        model && model.meta.id ? new Set([model.meta.id]) : config && config.id ? new Set([config.id]) : undefined;

    const filteredRows = useMemo(() => dataRows, [dataRows]);

    const handleSelect = useCallback(
        (card: ModelManifestEntry, downloader?: Downloader) => {
            if (downloader) {
                setDownload(downloader);
                downloader.start();
            } else if (!card.url && card.config) {
                // Not possible
                console.warn('No URL or downloader for trained model, cannot load');
            }
        },
        [setDownload]
    );

    return (
        <CardView
            data={filteredRows}
            onSelect={handleSelect}
            selectedSet={selectedSet}
            CardComponent={ModelCard}
        />
    );
}
