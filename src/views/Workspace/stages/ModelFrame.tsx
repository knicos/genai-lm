import type { WorkflowStage } from '../../../state/workflowSettings';
import CheckModel from '../../../workflow/CheckModel/CheckModel';
import ModelDesign from '../../../workflow/ModelDesign/ModelDesign';
import Frame from '../Frame';
import Foundation from '../../../workflow/Foundation/Foundation';
import { useAtomValue } from 'jotai';
import { workflowSteps } from '../../../state/workflowSettings';
import style from '../style.module.css';
import { useTranslation } from 'react-i18next';
import { Help } from '@genai-fi/base';

interface Props {
    registerFrame: (flow: WorkflowStage, element: HTMLDivElement | null) => void;
}

export default function ModelFrame(props: Props) {
    const steps = useAtomValue(workflowSteps);
    const { t } = useTranslation();

    return (
        <Frame
            name="model"
            {...props}
        >
            {steps.has('architecture') && (
                <div className={style.titleColumn}>
                    <Help
                        message={t('model.archHelp')}
                        inplace
                        keepOpen
                    >
                        <h3>{t('model.title')}</h3>
                    </Help>
                    {steps.has('architecture') && <ModelDesign />}
                </div>
            )}
            {steps.has('model') && (
                <div style={{ marginLeft: '2rem' }}>
                    <Foundation />
                </div>
            )}
            {steps.has('architecture') && <CheckModel />}
        </Frame>
    );
}
