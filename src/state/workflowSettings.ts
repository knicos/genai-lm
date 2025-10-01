import { atom } from 'jotai';

export type WorkflowSteps =
    | 'model'
    | 'data'
    | 'sampleExplore'
    | 'trainer'
    | 'evaluation'
    | 'modelInfo'
    | 'generator'
    | 'xai';

const DEFAULT_STEPS: WorkflowSteps[] = ['model', 'data', 'trainer', 'evaluation', 'generator'];

export const workflowSteps = atom<Set<WorkflowSteps>>(new Set<WorkflowSteps>(DEFAULT_STEPS));
