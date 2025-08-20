import { atom } from 'jotai';

export type WorkflowSteps = 'model' | 'data' | 'sampleExplore' | 'trainer' | 'evaluation' | 'modelInfo' | 'generator';

const DEFAULT_STEPS: WorkflowSteps[] = ['model', 'data', 'sampleExplore', 'trainer', 'evaluation', 'generator'];

export const workflowSteps = atom<Set<WorkflowSteps>>(new Set<WorkflowSteps>(DEFAULT_STEPS));
