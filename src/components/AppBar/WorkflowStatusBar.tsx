import { useAtomValue } from 'jotai';
import WorkflowBar from '../WorkflowBar/WorkflowBar';
import useModelLoaded from '../../utilities/useModelLoaded';
import useModelPhase from '../../utilities/useModelPhase';
import { dataTokens } from '../../state/data';
import { modelAtom } from '../../state/model';

export default function WorkflowStatusBar() {
    const model = useAtomValue(modelAtom);
    const loaded = useModelLoaded(model ?? undefined);
    const phase = useModelPhase(model ?? undefined);
    const preData = useAtomValue(dataTokens);

    const step1 = loaded;
    const step2 = preData && preData.length > 0;
    const step3 = step1 && step2 && phase === 'pretrained';
    const step4 = step1 && step2 && phase === 'finetuned';

    return (
        <WorkflowBar
            items={[
                { id: 'model', status: step1 ? 'complete' : 'available' },
                { id: 'pretraindata', status: step2 ? 'complete' : step1 ? 'available' : 'blocked' },
                { id: 'pretrain', status: step3 ? 'complete' : step2 ? 'available' : 'blocked' },
                { id: 'finetune', status: step4 ? 'complete' : step3 ? 'available' : 'blocked' },
                { id: 'deployment', status: step4 ? 'available' : 'blocked' },
            ]}
        />
    );
}
