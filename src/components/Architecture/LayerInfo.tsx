import style from './style.module.css';
import { GPTConfig } from '@genai-fi/nanogpt';
import { ExtendedConfig } from '../../state/model';
import prettyNumber from '../../utilities/prettyNumber';
import { useTranslation } from 'react-i18next';

interface Props {
    index: number;
    hiddenSize: number;
    arch: ExtendedConfig;
}

function estimateLayerParameters(config: GPTConfig): number {
    const attentionParams = 4 * config.nEmbed * config.nEmbed; // qkv + proj
    const mlpParams =
        config.mlpFactor * config.nEmbed * config.nEmbed + // fc
        config.nEmbed * config.mlpFactor * config.nEmbed; // proj

    return attentionParams + mlpParams;
}

export default function LayerInfo({ index, hiddenSize, arch }: Props) {
    const params = index >= 0 ? estimateLayerParameters(arch) : arch.nEmbed * arch.vocabSize;
    const { t } = useTranslation();

    return (
        <div className={style.layerInfo}>
            {index >= 0 && <h2>{t('model.layer', { index: index + 1 })}</h2>}
            <p>
                {t(index >= 0 ? 'model.width' : 'model.vocabSize')}: {index >= 0 ? hiddenSize : arch.vocabSize}
            </p>
            <p>
                {t('model.parameters')}: {prettyNumber(params, t)}
            </p>
        </div>
    );
}
