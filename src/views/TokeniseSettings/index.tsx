import { Checkbox, FormControl, FormControlLabel, Slider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import style from './style.module.css';
import { Button, Help } from '@genai-fi/base';
import { dataTokens, tokeniseSettingsAtom, validationTokens } from '../../state/data';
import { deleteData } from '../../utilities/db';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

export function Component() {
    const { t } = useTranslation();
    const [settings, setSettings] = useAtom(tokeniseSettingsAtom);
    const [trainTokens, setTrainTokens] = useAtom(dataTokens);
    const [valTokens, setValTokens] = useAtom(validationTokens);

    return (
        <div className="sidePanel">
            <h2>{t('app.settings.tokenise')}</h2>
            <FormControl className={style.sliderControl}>
                <div
                    id="validationsplit-label"
                    className={style.label}
                >
                    <Help
                        message={t('app.settings.help.validationSplit')}
                        inplace
                        dark
                    >
                        {t('app.settings.validationSplit')}
                    </Help>
                </div>
                <Slider
                    aria-labelledby="validationsplit-label"
                    value={settings.validationSplit}
                    onChange={(_, value) => setSettings({ ...settings, validationSplit: value as number })}
                    min={0}
                    max={0.5}
                    step={0.01}
                    valueLabelDisplay="auto"
                />
            </FormControl>
            <FormControl sx={{ marginTop: '1rem' }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={settings.saveToOPFS}
                            onChange={(_, checked) => setSettings({ ...settings, saveToOPFS: checked })}
                        />
                    }
                    label={
                        <Help
                            message={t('app.settings.help.saveToOPFS')}
                            inplace
                            dark
                        >
                            {t('app.settings.saveToOPFS')}
                        </Help>
                    }
                />
            </FormControl>
            <Button
                sx={{ marginTop: '1rem' }}
                startIcon={<DeleteForeverIcon />}
                variant="contained"
                onClick={() => {
                    setTrainTokens((prev) => {
                        if (prev) {
                            prev.tokens.dispose();
                        }
                        return null;
                    });
                    setValTokens((prev) => {
                        if (prev) {
                            prev.tokens.dispose();
                        }
                        return null;
                    });
                    deleteData();
                }}
                disabled={trainTokens === null && valTokens === null}
            >
                {t('tokeniseData.deleteAll')}
            </Button>
        </div>
    );
}
