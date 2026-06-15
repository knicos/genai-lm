import { atom } from 'jotai';

export type WorkflowSteps =
    | 'architecture'
    | 'model'
    | 'data'
    | 'tokeniser'
    | 'tokenise'
    | 'trainer'
    | 'pretrain-output'
    | 'conversations'
    | 'finetune'
    | 'generator'
    | 'share';

const DEFAULT_STEPS: WorkflowSteps[] = [
    'architecture',
    'data',
    'tokeniser',
    'tokenise',
    'trainer',
    'pretrain-output',
    'conversations',
    'finetune',
    'generator',
    'share',
];

export const workflowSteps = atom<Set<WorkflowSteps>>(new Set<WorkflowSteps>(DEFAULT_STEPS));

type WorkflowStage = 'model' | 'data' | 'pretrain' | 'finetune' | 'deployment';

export const workflowStages = atom<Set<WorkflowStage>>((get) => {
    const steps = get(workflowSteps);
    const stages = new Set<WorkflowStage>();
    if (steps.has('model')) stages.add('model');
    if (steps.has('architecture')) stages.add('model');
    if (steps.has('data') || steps.has('tokeniser') || steps.has('tokenise')) stages.add('data');
    if (steps.has('trainer') || steps.has('pretrain-output')) stages.add('pretrain');
    if (steps.has('finetune') || steps.has('conversations')) stages.add('finetune');
    if (steps.has('generator')) stages.add('deployment');

    return stages;
});
