import { TeachableLLM } from '@genai-fi/nanogpt';
import style from './style.module.css';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import useModelStatus from '../../utilities/useModelStatus';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import { generatorSettings } from '../../state/generator';
import { List, ListItemButton, ListItemIcon, ListItemText, Switch } from '@mui/material';
import Box from '../../components/BoxTitle/Box';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

interface Props {
    model?: TeachableLLM;
}

export default function XAIBox({ model }: Props) {
    const { t } = useTranslation();
    const status = useModelStatus(model);

    const [settings, setSettings] = useAtom(generatorSettings);
    const { showAttention, attentionBlock: attentionLayer } = settings;

    return (
        <Box
            widget="xai"
            active={!!model && status === 'ready'}
        >
            <div className={style.container}>
                <BoxTitle
                    title={t('xai.title')}
                    status={status === 'ready' ? 'done' : 'disabled'}
                />
                <Switch
                    value={showAttention}
                    onChange={(e) => setSettings({ ...settings, showAttention: e.target.checked })}
                />
                <List style={{ maxHeight: '250px', overflowY: 'auto', width: '100%' }}>
                    {status !== 'loading' &&
                        Array.from({ length: model?.config.nLayer || 0 }, (_, i) => i).map((layer) => (
                            <ListItemButton
                                key={layer}
                                className={`${style.button} ${attentionLayer === layer ? style.selected : ''}`}
                                onClick={() => setSettings({ ...settings, attentionBlock: layer })}
                            >
                                <ListItemIcon>
                                    {layer === attentionLayer ? (
                                        <RadioButtonCheckedIcon color="primary" />
                                    ) : (
                                        <RadioButtonUncheckedIcon color="disabled" />
                                    )}
                                </ListItemIcon>

                                <ListItemText primary={`Layer ${layer + 1}`} />
                            </ListItemButton>
                        ))}
                </List>
            </div>
        </Box>
    );
}
