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
    observer: IntersectionObserver;
    scrollFrame: string;
}

export default function ModelFrame({ observer, scrollFrame }: Props) {
    const steps = useAtomValue(workflowSteps);
    const { t } = useTranslation();

    return (
        <Frame
            name="model"
            observer={observer}
            scroll={scrollFrame === 'model'}
        >
            {steps.has('architecture') && (
                <div className={style.titleColumn}>
                    <Help
                        message={t('model.archHelp')}
                        inplace
                    >
                        <h3>{t('model.title')}</h3>
                    </Help>
                    {steps.has('architecture') && <ModelDesign />}
                </div>
            )}
            {steps.has('model') && <Foundation />}
            {steps.has('architecture') && <CheckModel />}
        </Frame>
    );
}
