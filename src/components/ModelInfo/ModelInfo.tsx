import { GPTConfig } from '@genai-fi/nanogpt';
import style from './style.module.css';
import AbcIcon from '@mui/icons-material/Abc';
import LayersIcon from '@mui/icons-material/Layers';
import NotesIcon from '@mui/icons-material/Notes';
import { useTranslation } from 'react-i18next';
import { TrainingStats } from '../ModelCard/type';
import TrainingDuration from './TrainingDuration';
import TrainingSamples from './TrainingSamples';

interface Props {
    config: Partial<GPTConfig>;
    tokeniser: 'char' | 'bpe';
    trainingStats?: TrainingStats;
    showDuration?: boolean;
    showSamples?: boolean;
    showTokens?: boolean;
    showContextSize?: boolean;
    showLayers?: boolean;
    showEmbeddingSize?: boolean;
}

export default function ModelInfo({
    config,
    tokeniser,
    trainingStats,
    showDuration,
    showSamples,
    showTokens,
    showContextSize,
    showLayers,
    showEmbeddingSize,
}: Props) {
    const { t } = useTranslation();

    return (
        <div className={style.modelInfo}>
            {showTokens && (
                <p>
                    <AbcIcon />{' '}
                    {t(tokeniser === 'char' ? 'model.charTokeniser' : 'model.bpeTokeniser', {
                        size: config.vocabSize || 0,
                    })}
                </p>
            )}
            {showLayers && (
                <p>
                    <LayersIcon /> {t('model.layers', { count: config.nLayer || 0 })}
                </p>
            )}
            {showContextSize && (
                <p>
                    <NotesIcon /> {t('model.contextSize', { size: config.blockSize || 'N/A' })}
                </p>
            )}
            {trainingStats && showDuration && <TrainingDuration duration={trainingStats.duration} />}
            {trainingStats && showSamples && <TrainingSamples samples={trainingStats.samples} />}
            {showEmbeddingSize && (
                <>
                    <p>{t('model.embeddingSize', { size: config.nEmbed || 'N/A' })}</p>
                </>
            )}
        </div>
    );
}
