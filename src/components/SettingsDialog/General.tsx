import { useAtom } from 'jotai';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import { Checkbox, FormControlLabel } from '@mui/material';
import { LangSelect } from '@genai-fi/base';
import { workflowSteps } from '../../state/workflowSettings';

export default function GeneralSettings() {
    const { t } = useTranslation();
    const [workflow, setWorkflow] = useAtom(workflowSteps);

    return (
        <div className={style.column}>
            <LangSelect />
            <div className={style.spacer} />
            <FormControlLabel
                control={
                    <Checkbox
                        checked={workflow.has('model')}
                        onChange={(_, checked) =>
                            setWorkflow((old) => {
                                const newWorkflow = new Set(old);
                                if (checked) {
                                    newWorkflow.add('model');
                                } else {
                                    newWorkflow.delete('model');
                                }
                                return newWorkflow;
                            })
                        }
                    />
                }
                label={t('app.settings.showModelSelect')}
            />
            <FormControlLabel
                control={
                    <Checkbox
                        checked={workflow.has('modelInfo')}
                        onChange={(_, checked) =>
                            setWorkflow((old) => {
                                const newWorkflow = new Set(old);
                                if (checked) {
                                    newWorkflow.add('modelInfo');
                                } else {
                                    newWorkflow.delete('modelInfo');
                                }
                                return newWorkflow;
                            })
                        }
                    />
                }
                label={t('app.settings.showModelInfo')}
            />
            <FormControlLabel
                control={
                    <Checkbox
                        checked={workflow.has('data')}
                        onChange={(_, checked) =>
                            setWorkflow((old) => {
                                const newWorkflow = new Set(old);
                                if (checked) {
                                    newWorkflow.add('data');
                                } else {
                                    newWorkflow.delete('data');
                                }
                                return newWorkflow;
                            })
                        }
                    />
                }
                label={t('app.settings.showDataEntry')}
            />
            <FormControlLabel
                control={
                    <Checkbox
                        checked={workflow.has('sampleExplore')}
                        onChange={(_, checked) =>
                            setWorkflow((old) => {
                                const newWorkflow = new Set(old);
                                if (checked) {
                                    newWorkflow.add('sampleExplore');
                                } else {
                                    newWorkflow.delete('sampleExplore');
                                }
                                return newWorkflow;
                            })
                        }
                    />
                }
                label={t('app.settings.showSampleExplore')}
            />
            <FormControlLabel
                control={
                    <Checkbox
                        checked={workflow.has('trainer')}
                        onChange={(_, checked) =>
                            setWorkflow((old) => {
                                const newWorkflow = new Set(old);
                                if (checked) {
                                    newWorkflow.add('trainer');
                                } else {
                                    newWorkflow.delete('trainer');
                                }
                                return newWorkflow;
                            })
                        }
                    />
                }
                label={t('app.settings.showTrainer')}
            />
            <FormControlLabel
                control={
                    <Checkbox
                        checked={workflow.has('evaluation')}
                        onChange={(_, checked) =>
                            setWorkflow((old) => {
                                const newWorkflow = new Set(old);
                                if (checked) {
                                    newWorkflow.add('evaluation');
                                } else {
                                    newWorkflow.delete('evaluation');
                                }
                                return newWorkflow;
                            })
                        }
                    />
                }
                label={t('app.settings.showEvaluation')}
            />
        </div>
    );
}
