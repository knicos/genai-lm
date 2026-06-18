import CardView from '../CardView/CardView';
import { useCallback, useMemo } from 'react';
import { ExtendedConfig, ModelManifestEntry, untrainedModelManifest } from '../../state/model';
import { TeachableLLM } from '@genai-fi/nanogpt';
import { useAtomValue } from 'jotai';
import Downloader from '../../utilities/downloader';
import ModelCard from '../ModelCard/ModelCard';

interface Props {
    model?: TeachableLLM;
    onModel?: (updater: (old: TeachableLLM | null) => TeachableLLM) => void;
    config?: ExtendedConfig;
    onConfig?: (config: ExtendedConfig) => void;
}

export default function SearchContent({ model, onModel, config, onConfig }: Props) {
    const dataRows = useAtomValue(untrainedModelManifest);
    const selectedSet =
        model && model.meta.id ? new Set([model.meta.id]) : config && config.id ? new Set([config.id]) : undefined;

    const filteredRows = useMemo(() => dataRows, [dataRows]);

    const handleSelect = useCallback(
        (card: ModelManifestEntry, downloader?: Downloader) => {
            if (downloader) {
                console.warn('Downloader provided for untrained model, but this should not happen');
            } else if (!card.url && card.config) {
                if (onModel) {
                    const newModel = TeachableLLM.create(card.config.vocabSize > 256 ? 'bpe' : 'char', card.config);
                    newModel.meta.id = card.id;
                    newModel.meta.name = card.title;
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
        [onModel, onConfig]
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
