import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { TokenSelectState, uiSelectedTokens, uiTokenHighlightMode, uiTokenSelectLength } from '../../state/uiState';
import { useEffect, useRef, useState } from 'react';
import { changesFromRescore, sliceSelectedText, Changes } from './utilities';
import { loadedModelAtom } from '../../state/model';
import {
    ConversationHighlight,
    ExtendedGeneratorConversation,
    generatorSettings,
    rawGeneratedTextAtom,
    rawHighlightsAtom,
} from '../../state/generator';
import { BusyButton, Button, Help } from '@genai-fi/base';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import { InputAdornment, TextField } from '@mui/material';
import { IGeneratorOutput, IGeneratorResponse } from '@genai-fi/nanogpt';
import ChangeList from './ChangeList';
import UndoIcon from '@mui/icons-material/Undo';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

interface ReplacerSnapshot {
    conversation: ExtendedGeneratorConversation[];
    changes: Changes[];
    modifiedTokenIndices: number[];
    originalSelection: TokenSelectState | null;
    selection: TokenSelectState | null;
    selectedText: string | null;
}

function cloneConversation(value: ExtendedGeneratorConversation[]): ExtendedGeneratorConversation[] {
    return value.map((conversationItem) => ({
        ...conversationItem,
        _output: conversationItem._output?.map((outputItem) => ({ ...outputItem })),
    }));
}

function getConversationIdentity(conversationItem: ExtendedGeneratorConversation): string {
    return `${conversationItem._id ?? 'none'}:${conversationItem._timestamp ?? 'none'}`;
}

function getModifiedTokenHighlights(
    conversationIndex: number,
    modifiedTokenIndices: number[]
): ConversationHighlight[] {
    return modifiedTokenIndices.map(
        (tokenIndex) =>
            ({
                index: conversationIndex,
                start: tokenIndex,
                end: tokenIndex,
                colour: 'purple',
            }) as ConversationHighlight
    );
}

export default function Replacer() {
    const { t } = useTranslation();
    const [selection, setSelection] = useAtom(uiSelectedTokens);
    const setSelectionLength = useSetAtom(uiTokenSelectLength);
    //const [beams, setBeams] = useState<ExtendedIBeam[]>([]);
    const model = useAtomValue(loadedModelAtom);
    const [conversation, setConversation] = useAtom(rawGeneratedTextAtom);
    const settings = useAtomValue(generatorSettings);
    //const setId = useSetAtom(rawGenerationIDAtom);
    const [busy, setBusy] = useState(false);
    const setHighlightProbs = useSetAtom(uiTokenHighlightMode);
    const setHighlights = useSetAtom(rawHighlightsAtom);
    const convoRef = useRef(conversation);
    const [selectedText, setSelectedText] = useState<string | null>(null);
    const modifiedTokens = useRef(new Set<number>());
    const activeConversationIdentityRef = useRef<string | null>(null);
    const [changes, setChanges] = useState<Changes[]>([]);
    const originalSelectRef = useRef<TokenSelectState>(null);
    const undoStackRef = useRef<ReplacerSnapshot[]>([]);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const firstConversation = conversation[conversation.length - 1];
    convoRef.current = conversation;

    useEffect(() => {
        setSelectionLength(24);
        setSelection(null);
        setHighlightProbs('none');
        setHighlights([]);
        return () => {
            setSelectionLength(0);
            setSelection(null);
            setHighlightProbs('none');
            setHighlights([]);
        };
    }, [setSelectionLength, setSelection, setHighlightProbs, setHighlights]);

    useEffect(() => {
        if (firstConversation && activeConversationIdentityRef.current !== getConversationIdentity(firstConversation)) {
            activeConversationIdentityRef.current = getConversationIdentity(firstConversation);
            setChanges([]);
            modifiedTokens.current.clear();
            setHighlights([]);
            setHighlightProbs('none');
            undoStackRef.current = [
                {
                    conversation: cloneConversation(conversation),
                    changes: [],
                    modifiedTokenIndices: [],
                    originalSelection: null,
                    selection: null,
                    selectedText: null,
                },
            ];
        }
    }, [conversation, firstConversation, setHighlights, setHighlightProbs]);

    const doReplace = async () => {
        if (selection && model && selectedText !== null) {
            setBusy(true);
            setHighlightProbs('rescore');

            originalSelectRef.current = selection;

            // First, replace the selected text with the new text from the TextField (selectedText)
            const selectedConversation = conversation[selection.conversationIndex];
            const beforeOutput = selectedConversation._output?.slice(0, selection.startToken);
            const afterOutput = selectedConversation._output?.slice(selection.endToken + 1);
            const newTokens = model.tokeniser.encode(selectedText);
            const newOutputs: IGeneratorOutput[] = newTokens.map((token) => ({
                token,
                text: model.tokeniser.decode([token]),
                confidence: null,
                score: null,
                logits: null,
                scores: null,
                hiddenStates: null,
                attention: null,
                multinomialRand: null,
                terminated: false,
                loss: null,
            }));
            selectedConversation._output = beforeOutput?.concat(newOutputs).concat(afterOutput ?? []);
            selectedConversation.content = selectedConversation._output?.map((o) => o.text).join('') ?? '';

            for (let i = selection.startToken; i <= selection.startToken + newTokens.length - 1; i++) {
                modifiedTokens.current.add(i);
            }

            const selectHighlights = Array.from(modifiedTokens.current).map(
                (i) =>
                    ({
                        index: selection.conversationIndex,
                        start: i,
                        end: i,
                        colour: 'purple',
                    }) as ConversationHighlight
            );
            setHighlights(selectHighlights);

            const animationFrameRef = { current: -1 };
            const originalConvo = [...conversation];

            // Blank out the conversation
            originalConvo.forEach((c) => {
                c._output?.forEach((o) => {
                    o.rescore = undefined;
                });
            });

            const h = (output: IGeneratorResponse) => {
                const convo = output.output ?? [];
                convoRef.current = convo;

                if (animationFrameRef.current === -1) {
                    animationFrameRef.current = requestAnimationFrame(() => {
                        setConversation([...originalConvo]);

                        animationFrameRef.current = -1;
                    });
                }
            };

            const resid = await model.responses.create(
                {
                    ...settings,
                    background: true,
                    input: conversation,
                    nonConversational: true,
                    rescore: true,
                    outputScore: true,
                },
                h
            );

            const doneHandler = (id: string) => {
                if (id === resid.id) {
                    const conversationWithRescore = cloneConversation(convoRef.current);
                    const nextChanges = changesFromRescore(
                        conversationWithRescore,
                        selection.conversationIndex,
                        0.4,
                        modifiedTokens.current
                    );
                    setConversation(conversationWithRescore);
                    setChanges(nextChanges);
                    setBusy(false);
                    setHighlights(selectHighlights);
                    undoStackRef.current.push({
                        conversation: cloneConversation(conversationWithRescore),
                        changes: nextChanges.map((change) => ({ ...change })),
                        modifiedTokenIndices: Array.from(modifiedTokens.current),
                        originalSelection: originalSelectRef.current ? { ...originalSelectRef.current } : null,
                        selection: selection ? { ...selection } : null,
                        selectedText,
                    });
                    model.responses.off('done', doneHandler);
                }
            };
            model.responses.on('done', doneHandler);
        }
    };

    useEffect(() => {
        if (selection) {
            const text = sliceSelectedText(conversation, selection);
            setSelectedText(text);
            inputRef.current?.focus();
        } else {
            setSelectedText(null);
        }
    }, [selection, conversation]);

    return (
        <div className={style.toolContainer}>
            <Help
                inplace
                dark
                message={t('audit.replacer.help')}
                keepOpen
                placement="left"
            >
                <h3>{t('audit.replacer.title')}</h3>
            </Help>

            <TextField
                inputRef={inputRef}
                label={t('audit.replacer.selectedText')}
                value={selectedText ?? ''}
                onChange={(e) => setSelectedText(e.target.value)}
                fullWidth
                variant="outlined"
                margin="normal"
                disabled={selectedText === null}
                slotProps={
                    selection
                        ? {
                              input: {
                                  startAdornment: (
                                      <InputAdornment
                                          position="start"
                                          sx={{ marginRight: 0 }}
                                      >
                                          {sliceSelectedText(conversation, selection, -3)}
                                      </InputAdornment>
                                  ),
                              },
                          }
                        : undefined
                }
            />

            <div className={style.buttonContainer}>
                <BusyButton
                    variant="contained"
                    color="primary"
                    onClick={doReplace}
                    disabled={selectedText === null}
                    busy={busy}
                    startIcon={<PlayArrowIcon />}
                >
                    {t('audit.replacer.go')}
                </BusyButton>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<UndoIcon />}
                    onClick={() => {
                        if (undoStackRef.current.length <= 1) {
                            return;
                        }

                        undoStackRef.current = undoStackRef.current.slice(0, -1);
                        const previousSnapshot = undoStackRef.current[undoStackRef.current.length - 1];
                        setConversation(cloneConversation(previousSnapshot.conversation));
                        setChanges(previousSnapshot.changes.map((change) => ({ ...change })));
                        setSelection(previousSnapshot.selection ? { ...previousSnapshot.selection } : null);
                        setSelectedText(previousSnapshot.selectedText);
                        setHighlights(
                            previousSnapshot.originalSelection
                                ? getModifiedTokenHighlights(
                                      previousSnapshot.originalSelection.conversationIndex,
                                      previousSnapshot.modifiedTokenIndices
                                  )
                                : []
                        );
                        setHighlightProbs(previousSnapshot.changes.length > 0 ? 'rescore' : 'none');
                        modifiedTokens.current = new Set(previousSnapshot.modifiedTokenIndices);
                        originalSelectRef.current = previousSnapshot.originalSelection
                            ? { ...previousSnapshot.originalSelection }
                            : null;
                        setBusy(false);
                    }}
                    disabled={undoStackRef.current.length <= 1 || busy}
                >
                    {t('audit.replacer.reset')}
                </Button>
            </div>

            <ChangeList
                changes={changes}
                conversation={conversation}
                conversationIndex={originalSelectRef.current?.conversationIndex ?? 0}
                snippetSize={2}
                onSelect={(change) => {
                    const selectHighlights = originalSelectRef.current
                        ? Array.from(modifiedTokens.current).map(
                              (i) =>
                                  ({
                                      index: originalSelectRef.current?.conversationIndex ?? 0,
                                      start: i,
                                      end: i,
                                      colour: 'purple',
                                  }) as ConversationHighlight
                          )
                        : [];
                    setHighlights([
                        ...selectHighlights,
                        {
                            index: originalSelectRef.current?.conversationIndex ?? 0,
                            start: change.tokenIndex,
                            end: change.tokenIndex,
                            colour: change.change > 0 ? 'green' : 'red',
                            erase: false,
                            noBackground: false,
                        },
                    ]);
                }}
            />
        </div>
    );
}
