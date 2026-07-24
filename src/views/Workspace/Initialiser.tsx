import { useEffect, useRef, useState } from 'react';
import { TeachableLLM } from '@genai-fi/nanogpt';
import { useAtomValue, useSetAtom } from 'jotai';
import { modelAtom, modelConfigAtom } from '../../state/model';
import { createEntriesFromManifest, dataEntries, dataTokens } from '../../state/data';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FlowType } from '../../hooks/useChangePath';
import { workflowSteps, WorkflowSteps } from '../../state/workflowSettings';
import { uiCompactMode, uiDeveloperMode } from '../../state/uiState';
import { initializeLogger } from '../../utilities/logger';
import { deleteData, getData, getCheckpoint, deleteCheckpoint } from '../../utilities/db';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';

type VariantType = 'empty' | 'base' | 'finetune' | 'complete' | 'advanced';

const INIT_COMPLETE_KEY = 'init_complete';

export default function Initialiser() {
    const { t } = useTranslation();
    // const [searchParams] = useSearchParams();
    const modelConfig = useAtomValue(modelConfigAtom);
    const setModel = useSetAtom(modelAtom);
    const { flow, variant } = useParams() as { flow: FlowType; variant: VariantType };
    const setDataTokens = useSetAtom(dataTokens);
    const setDataEntries = useSetAtom(dataEntries);
    const setWorkflowSteps = useSetAtom(workflowSteps);
    const setDevMode = useSetAtom(uiDeveloperMode);
    const setCompact = useSetAtom(uiCompactMode);
    const [params] = useSearchParams();
    const [showConfirm, setShowConfirm] = useState(false);

    const pageLog = useRef(new Set<string>());

    const buildModel = async () => {
        const newModel = TeachableLLM.create(modelConfig.vocabSize <= 256 ? 'char' : 'bpe', modelConfig);
        newModel.meta.id = 'untrained-custom';
        newModel.meta.name = t('model.defaultName');
        newModel.meta.trained = false;
        setModel(newModel);
        await deleteData();
    };

    const doInit = async () => {
        window.sessionStorage.setItem(INIT_COMPLETE_KEY, 'true');

        const checkpoint = await getCheckpoint();

        if (checkpoint) {
            const newModel = TeachableLLM.loadModel(checkpoint as File);
            setModel(newModel);

            const existingData = await getData();

            newModel.on('loaded', () => {
                if (
                    existingData?.tokens &&
                    existingData.tokeniserId === newModel.tokeniser.id &&
                    existingData.datasetId
                ) {
                    setDataTokens({
                        tokens: existingData.tokens,
                        tokeniserId: existingData.tokeniserId,
                        datasetId: existingData.datasetId,
                    });
                } else {
                    setDataTokens(null);
                    deleteData();
                }

                if (newModel.meta.pretrainingData) {
                    createEntriesFromManifest(newModel.meta.pretrainingData).then((entries) => {
                        setDataEntries(entries);
                    });
                }
            });

            return;
        }

        if (flow !== 'home' && variant !== 'base' && variant !== 'finetune') {
            buildModel().catch((e) => {
                console.error('Failed to build model', e);
            });
        }
    };

    const initialise = async () => {
        const checkpoint = await getCheckpoint();
        const hasInitAlready = window.sessionStorage.getItem(INIT_COMPLETE_KEY) === 'true';

        if (checkpoint && !hasInitAlready) {
            setShowConfirm(true);
            return;
        }

        await doInit();
    };

    if (pageLog.current.size === 0 && flow !== 'home') {
        initialise();
    }
    if (flow !== 'home') {
        pageLog.current.add(flow);
    }

    useEffect(() => {
        if (variant === 'empty') {
            const steps = new Set<WorkflowSteps>();
            steps.add('architecture');
            steps.add('data');
            steps.add('tokeniser');
            steps.add('tokenise');
            steps.add('trainer');
            steps.add('pretrain-output');
            setWorkflowSteps(steps);
            setDevMode(false);
            setCompact(false);
        } else if (variant === 'base') {
            const steps = new Set<WorkflowSteps>();
            steps.add('model');
            steps.add('data');
            steps.add('trainer');
            steps.add('pretrain-output');
            steps.add('share');
            setWorkflowSteps(steps);
            setDevMode(false);
            setCompact(false);
        } else if (variant === 'finetune') {
            const steps = new Set<WorkflowSteps>();
            steps.add('model');
            steps.add('conversations');
            steps.add('finetune');
            steps.add('generator');
            steps.add('share');
            setWorkflowSteps(steps);
            setDevMode(false);
            setCompact(false);
        } else if (variant === 'complete') {
            const steps = new Set<WorkflowSteps>();
            steps.add('architecture');
            steps.add('data');
            steps.add('tokeniser');
            steps.add('tokenise');
            steps.add('trainer');
            steps.add('pretrain-output');
            steps.add('conversations');
            steps.add('finetune');
            steps.add('generator');
            steps.add('share');
            setWorkflowSteps(steps);
            setDevMode(false);
            setCompact(false);
        } else if (variant === 'advanced') {
            const steps = new Set<WorkflowSteps>();
            steps.add('architecture');
            steps.add('data');
            steps.add('tokeniser');
            steps.add('tokenise');
            steps.add('trainer');
            steps.add('pretrain-output');
            steps.add('conversations');
            steps.add('finetune');
            steps.add('generator');
            steps.add('share');
            setWorkflowSteps(steps);
            setDevMode(true);
            setCompact(true);
        }
    }, [variant, setWorkflowSteps, setDevMode, setCompact]);

    useEffect(() => {
        const token = params.get('t');
        if (token) {
            initializeLogger(token);
        }

        const hf = params.get('hf');
        if (hf) {
            const m = TeachableLLM.loadModel(hf);
            setModel(m);
        }
    }, [params, setModel]);

    /*const modelParam = searchParams.get('model');

    useEffect(() => {
        // Use provided model id from URL params
        if (modelParam) {
            loadModelById(modelParam);
            // Load untrained model for pretrain workflow
        } else {
            // loadModelById('untrained-small');
        }
    }, [modelParam, loadModelById]);*/

    return (
        <ConfirmDialog
            open={showConfirm}
            title={t('app.confirmLoad.title')}
            message={t('app.confirmLoad.message')}
            confirmText={t('app.confirmLoad.confirm')}
            onConfirm={() => {
                doInit();
                setShowConfirm(false);
            }}
            onCancel={() => {
                deleteCheckpoint().then(() => {
                    doInit();
                });
                setShowConfirm(false);
            }}
        />
    );
}
