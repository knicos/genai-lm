import { TeachableLLM } from '@genai-fi/nanogpt';
import ModelVisualisation from '../../components/ModelVisualisation/ModelVisualisation';
import { useTranslation } from 'react-i18next';
import { uiShowVisualisation } from '../../state/uiState';
import { useAtomValue } from 'jotai';
import style from './style.module.css';
import Box from '../../components/BoxTitle/Box';
import BoxTitle from '../../components/BoxTitle/BoxTitle';

interface Props {
    model?: TeachableLLM;
}

export default function LanguageModel({ model }: Props) {
    const { t } = useTranslation();
    const showVisualisation = useAtomValue(uiShowVisualisation);

    return (
        <Box
            widget="thread"
            style={{ maxWidth: '80%' }}
            active={!!model}
        >
            <div className={style.container}>
                <BoxTitle
                    title={t('model.languageModel')}
                    status={model ? 'done' : 'disabled'}
                    style={{ backgroundColor: '#444', color: 'white' }}
                    dark
                />
                {showVisualisation && <ModelVisualisation model={model} />}
            </div>
        </Box>
    );
}
