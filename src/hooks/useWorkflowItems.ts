import { useAtomValue } from 'jotai';
import { modelAtom } from '../state/model';
import useModelLoaded from './useModelLoaded';
import useModelPhase from './useModelPhase';
import { dataTokens } from '../state/data';
import { workflowStages } from '../state/workflowSettings';

export type WorkflowStatus = 'complete' | 'available' | 'blocked';

interface Item {
    id: string;
    status: WorkflowStatus;
}

export default function useWorkflowItems(): Item[] {
    const model = useAtomValue(modelAtom);
    const loaded = useModelLoaded(model ?? undefined);
    const phase = useModelPhase(model ?? undefined);
    const preData = useAtomValue(dataTokens);
    const stages = useAtomValue(workflowStages);

    const step1 = loaded;
    const step2 = preData && preData.tokens.length > 0;
    const step3 = step1 && step2 && phase === 'pretrained';
    const step4 = step1 && step2 && phase === 'finetuned';

    const items: Item[] = [];
    if (stages.has('model')) {
        items.push({ id: 'model', status: step1 ? 'complete' : 'available' });
    }
    if (stages.has('data')) {
        items.push({ id: 'data', status: step2 ? 'complete' : step1 ? 'available' : 'blocked' });
    }
    if (stages.has('pretrain')) {
        items.push({ id: 'pretrain', status: step3 ? 'complete' : step2 ? 'available' : 'blocked' });
    }
    if (stages.has('finetune')) {
        items.push({ id: 'finetune', status: step4 ? 'complete' : step3 ? 'available' : 'blocked' });
    }
    if (stages.has('deployment')) {
        items.push({ id: 'deployment', status: step4 ? 'available' : 'blocked' });
    }

    return items;
}
