import { Help } from '@genai-fi/base';
import style from './style.module.css';
import WarningIcon from '@mui/icons-material/Warning';
import prettyNumber from '../../utilities/prettyNumber';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { ExtendedConfig, modelSizeLimit } from '../../state/model';
import { utilities, TeachableLLM } from '@genai-fi/nanogpt';
import Architecture from '../../components/Architecture/Architecture';
import CommentsDisabledIcon from '@mui/icons-material/CommentsDisabled';
import ChatIcon from '@mui/icons-material/Chat';

interface Props {
    config?: ExtendedConfig | null;
    model?: TeachableLLM | null;
    asTrained?: boolean;
}

function extractModelStats(model: TeachableLLM | null) {
    if (!model) return { trainingTokens: 0 };
    const trainingTokens = model.meta.actionLog?.reduce(
        (acc, action) => (action.action === 'pretrain' ? action.tokensProcessed + acc : acc),
        0
    );
    return { trainingTokens };
}

export default function ModelInfo({ config, model, asTrained }: Props) {
    const { t } = useTranslation();
    const sizeLimit = useAtomValue(modelSizeLimit) * 1_000_000;
    const arch = config ?? model?.config;
    if (!arch) return null;
    const estimated = utilities.estimateParameterCount(arch);

    const { trainingTokens } = extractModelStats(model ?? null);

    return (
        <div className={style.modelInfo}>
            <Architecture
                architecture={arch}
                noLabels
                autoFit
                style={{ flexBasis: '40%' }}
            />
            <div className={style.infoColumn}>
                {asTrained && model && (
                    <div className={style.parameters}>
                        <h3>{model.meta.name ?? 'Unamed Model'}</h3>
                    </div>
                )}
                <div className={style.parameters}>
                    <Help
                        message={t('model.parametersHelp')}
                        inplace
                        keepOpen
                    >
                        {estimated > sizeLimit && !asTrained && (
                            <WarningIcon
                                color="warning"
                                fontSize="medium"
                                sx={{ marginRight: '0.5rem' }}
                            />
                        )}
                        <span className={style.number}>{`${prettyNumber(estimated, t)}`}</span>
                        {`${t('model.parameters')}`}
                    </Help>
                </div>
                {!asTrained && (
                    <div className={style.parameters}>
                        <Help
                            message={t('model.layersHelp')}
                            inplace
                            keepOpen
                        >
                            <span className={style.number}>{arch.nLayer}</span>
                            {`${t('model.layersInfo')}`}
                        </Help>
                    </div>
                )}
                {!asTrained && (
                    <div className={style.parameters}>
                        <Help
                            message={t('model.vocabSizeHelp')}
                            inplace
                            keepOpen
                        >
                            <span className={style.number}>{arch.vocabSize}</span>
                            {`${t('model.vocabSizeInfo')}`}
                        </Help>
                    </div>
                )}
                {asTrained && (
                    <div className={style.parameters}>
                        <span className={style.number}>{prettyNumber(trainingTokens ?? 0, t)}</span>
                        {`${t('foundation.trainingTokens')}`}
                    </div>
                )}
                {asTrained && model && (
                    <div className={style.parameters}>
                        {model.mode === 'conversational' ? (
                            <>
                                <ChatIcon
                                    fontSize="small"
                                    sx={{ marginRight: '0.5rem' }}
                                />
                                <span>{t('foundation.conversational')}</span>
                            </>
                        ) : (
                            <>
                                <CommentsDisabledIcon
                                    fontSize="small"
                                    sx={{ marginRight: '0.5rem' }}
                                />
                                <span>{t('foundation.nonConversational')}</span>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
