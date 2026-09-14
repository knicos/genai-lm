import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { uiSelectedTokens, uiTokenHighlightMode, uiTokenSelectLength } from '../../state/uiState';
import { generatorSettings, rawGenerationIDAtom } from '../../state/generator';
import { useEffect, useState } from 'react';
import type { IBeam, GeneratorConversation } from '@genai-fi/nanogpt';
import { loadedModelAtom } from '../../state/model';
import { rawGeneratedTextAtom } from '../../state/generator';
import { Help, PercentageBar } from '@genai-fi/base';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import { Alert, FormControlLabel, Switch } from '@mui/material';
import useGenerate from '../../hooks/useGenerate';

function sliceConversation(conversation: GeneratorConversation[], index: number, tokenIndex: number) {
    const sliceConvo = conversation.slice(0, index + 1);
    if (sliceConvo.length > 0) {
        const lastMessage = sliceConvo[sliceConvo.length - 1];
        const slicedOutput = lastMessage._output?.slice(0, tokenIndex);
        sliceConvo[sliceConvo.length - 1] = {
            ...lastMessage,
            _output: slicedOutput,
            content: slicedOutput?.map((o) => o.text).join('') ?? '',
        };
    }
    return sliceConvo;
}

function safeText(text: string): string {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
        return ' ';
    }
    return trimmed;
}

interface ExtendedIBeam extends IBeam {
    isOriginal?: boolean;
}

export default function Beaming() {
    const { t } = useTranslation();
    const [selection, setSelection] = useAtom(uiSelectedTokens);
    const setSelectionLength = useSetAtom(uiTokenSelectLength);
    const [beams, setBeams] = useState<ExtendedIBeam[]>([]);
    const model = useAtomValue(loadedModelAtom);
    const [conversation, setConversation] = useAtom(rawGeneratedTextAtom);
    const setId = useSetAtom(rawGenerationIDAtom);
    const [busy, setBusy] = useState(false);
    const [highlightProbs, setHighlightProbs] = useAtom(uiTokenHighlightMode);
    const { generate } = useGenerate(setConversation);
    const settings = useAtomValue(generatorSettings);

    useEffect(() => {
        setSelectionLength(24);
        setSelection(null);
        return () => {
            setSelectionLength(0);
            setSelection(null);
            setHighlightProbs('none');
        };
    }, [setSelectionLength, setSelection, setHighlightProbs]);

    useEffect(() => {
        if (selection && model) {
            const convo = sliceConversation(conversation, selection.conversationIndex, selection.startToken);
            const originalText =
                conversation[selection.conversationIndex]?._output
                    ?.slice(selection.startToken, selection.endToken + 1)
                    .map((o) => o.text)
                    .join('') ?? '';
            setBusy(true);

            model.beaming.cancel();
            const beamid = model.beaming.create(convo, {
                maxBeamLength: selection.endToken - selection.startToken + 1,
                beams: 5,
                topP: 0.9,
                endOnWhiteSpace: true,
            });
            const progressHandler = (id: string, beams: IBeam[]) => {
                if (id === beamid) {
                    setBeams(beams);
                }
            };
            model.beaming.on('progress', progressHandler);
            const doneHandler = (id: string, beams: IBeam[]) => {
                if (id === beamid) {
                    setBeams(
                        beams.map((beam) => ({
                            ...beam,
                            isOriginal: beam.text.slice(0, originalText.length) === originalText,
                        }))
                    );
                    setBusy(false);
                    model.beaming.off('progress', progressHandler);
                    model.beaming.off('done', doneHandler);
                }
            };
            model.beaming.on('done', doneHandler);
            model.beaming.on('progress', progressHandler);
        } else {
            setBeams([]);
        }
    }, [selection, model, conversation]);

    return (
        <div className={style.toolContainer}>
            <Help
                inplace
                dark
                message={t('audit.beaming.help')}
                keepOpen
                placement="left"
            >
                <h3>{t('audit.beaming.title')}</h3>
            </Help>
            {beams.length === 0 ? (
                <Alert severity="info">{t('audit.beaming.noBeams')}</Alert>
            ) : (
                <ul className={style.beamingList}>
                    {beams.map((beam, index) => (
                        <li
                            key={index}
                            role="button"
                            onClick={() => {
                                if (selection) {
                                    setSelection(null);

                                    const convo = sliceConversation(
                                        conversation,
                                        selection.conversationIndex,
                                        selection.startToken
                                    );
                                    const selectionLength = selection.endToken - selection.startToken + 1;
                                    const beamOut = beam._output?.slice(0, selectionLength) ?? [];
                                    const last = convo[convo.length - 1];
                                    const newLast: GeneratorConversation = {
                                        role: last.role,
                                        content: last.content + beamOut.map((o) => o.text).join(''),
                                        _output: [...(last._output ?? []), ...beamOut],
                                    };

                                    convo[convo.length - 1] = newLast;
                                    generate(
                                        {
                                            ...settings,
                                            continuation: true,
                                        },
                                        convo
                                    )
                                        .then((id) => setId(id))
                                        .catch((error) => console.error(error));
                                }
                            }}
                        >
                            <PercentageBar
                                value={busy ? 0 : beam.score * 100}
                                colour={beam.isOriginal ? 'green' : 'blue'}
                                style={{ flexShrink: 0, flexBasis: '80px', fontSize: '0.8rem', height: '1.4rem' }}
                            />
                            <div className={`${style.beamingText} ${beam.isOriginal ? style.original : ''}`}>
                                {safeText(beam.text)}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            {beams.length > 0 && (
                <div className={style.candidates}>{t('audit.beaming.candidates', { count: beams[0].candidates })}</div>
            )}
            <FormControlLabel
                sx={{ marginTop: '1rem' }}
                control={
                    <Switch
                        checked={highlightProbs === 'score'}
                        onChange={() => setHighlightProbs(highlightProbs === 'score' ? 'none' : 'score')}
                        color="primary"
                    />
                }
                label={t('audit.beaming.highlightProbs')}
            />
        </div>
    );
}
