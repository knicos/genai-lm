import { Button, Spinner } from '@genai-fi/base';
import { FormControl, Slider, TextField } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { conversationDataAtom } from '../../state/data';
// import InstructGenerator from '../../utilities/InstructGenerator';
// import { Conversation } from '@genai-fi/nanogpt';
import { useState } from 'react';
import { loadedModelAtom } from '../../state/model';
import { apiSettingsAtom } from '../../state/api';
// import { createDatasetFromEntries } from '../../utilities/dataset';
import AutoTune from '../../services/AutoTune';
import style from './style.module.css';

export function Component() {
    const { t } = useTranslation();
    const model = useAtomValue(loadedModelAtom);
    const settings = useAtomValue(apiSettingsAtom);
    const setConversations = useSetAtom(conversationDataAtom);
    const [generating, setGenerating] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [user, setUser] = useState('');
    const [size, setSize] = useState(10);
    const [progress, setProgress] = useState(0);

    const doTune = async () => {
        setGenerating(true);
        try {
            if (model) {
                const tuner = new AutoTune(model, settings);

                const counter = {
                    count: 0,
                };

                tuner.on('conversation', (conversation) => {
                    setConversations(async (prev) => [...(await prev), conversation]);
                    counter.count += 1;
                    setProgress(counter.count / size);
                });

                await tuner.tune({
                    instruction: prompt,
                    size: size,
                    user: user.length > 0 ? user : undefined,
                });
                //setConversations(conversations);

                tuner.removeAllListeners();
            }
        } catch (err) {
            console.error('Error during AutoTune:', err);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="sidePanel">
            <h2>{t('instruct.autoTune')}</h2>
            <div className={style.container}>
                <TextField
                    label={t('instruct.userCharacteristics')}
                    multiline
                    minRows={4}
                    maxRows={8}
                    variant="outlined"
                    fullWidth
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    style={{ marginBottom: '16px' }}
                />
                <TextField
                    label={t('instruct.autoTunePrompt')}
                    multiline
                    minRows={6}
                    maxRows={12}
                    variant="outlined"
                    fullWidth
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    style={{ marginBottom: '16px' }}
                />
                <FormControl className={style.sliderControl}>
                    <div
                        id="epochs-label"
                        className={style.label}
                    >
                        {t('instruct.autotuneSize')}
                    </div>
                    <Slider
                        aria-labelledby="epochs-label"
                        value={size}
                        onChange={(_: unknown, value: number) => setSize(value as number)}
                        min={1}
                        max={100}
                        step={1}
                        valueLabelDisplay="auto"
                    />
                </FormControl>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={doTune}
                >
                    {t('instruct.generateTuneData')}
                </Button>
                {generating && (
                    <div className={style.overlay}>
                        <Spinner size="large" />
                        <div>{Math.round(progress * 100)}%</div>
                    </div>
                )}
            </div>
        </div>
    );
}
