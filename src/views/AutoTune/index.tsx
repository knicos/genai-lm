import { Button } from '@genai-fi/base';
import { TextField } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { conversationDataAtom, datasetAtom } from '../../state/data';
import InstructGenerator from '../../utilities/InstructGenerator';
import { Conversation } from '@genai-fi/nanogpt';
import { useEffect, useState } from 'react';

export function Component() {
    const { t } = useTranslation();
    const dataset = useAtomValue(datasetAtom);
    const setConversations = useSetAtom(conversationDataAtom);
    const [generating, setGenerating] = useState(false);
    const [prompt, setPrompt] = useState('');

    useEffect(() => {
        if (generating) {
            const generator = new InstructGenerator();
            console.log('Starting instruction generation...');
            generator.on('conversation', (convo: Conversation[]) => {
                console.log('New conversation generated:', convo);
                setConversations((old: Conversation[][]) => [...old, convo]);
            });
            generator
                .initialize()
                .then(() => {
                    generator
                        .start({
                            dataSet: dataset,
                            count: 10,
                            rate: 1,
                            mode: 'direct',
                            templates: [{ template: prompt }],
                        })
                        .then(() => {
                            setGenerating(false);
                        })
                        .catch((err) => {
                            console.error('Error during instruction generation:', err);
                            setGenerating(false);
                        });
                })
                .catch((err) => {
                    console.error('Error initializing generator:', err);
                    setGenerating(false);
                });
            return () => {
                generator.stop();
            };
        }
    }, [generating, dataset, setConversations]);

    return (
        <div className="sidePanel">
            <h2>{t('instruct.autoTune')}</h2>
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
            <Button
                variant="contained"
                color="primary"
                onClick={async () => {
                    setGenerating(true);
                }}
            >
                {t('instruct.generateTuneData')}
            </Button>
        </div>
    );
}
