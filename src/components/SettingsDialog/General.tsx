import { useAtom } from 'jotai';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import { Checkbox, FormControlLabel } from '@mui/material';
import { LangSelect } from '@genai-fi/base';
import { workflowSteps } from '../../state/workflowSettings';
import { uiCompactMode, uiDeveloperMode } from '../../state/uiState';
import { modelSaveCheckpoints } from '../../state/model';

export default function GeneralSettings() {
    const { t } = useTranslation();
    const [workflow, setWorkflow] = useAtom(workflowSteps);
    const [developerMode, setDeveloperMode] = useAtom(uiDeveloperMode);
    const [compactMode, setCompactMode] = useAtom(uiCompactMode);
    const [saveCheckpoints, setSaveCheckpoints] = useAtom(modelSaveCheckpoints);

    return (
        <div className={style.columns}>
            <div className={style.column}>
                <LangSelect />
                <div className={style.spacer} />
                <fieldset className={style.fieldset}>
                    <legend className={style.label}>{t('app.settings.workflowElements')}</legend>
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
                                checked={workflow.has('trainer')}
                                onChange={(_, checked) =>
                                    setWorkflow((old) => {
                                        const newWorkflow = new Set(old);
                                        if (checked) {
                                            newWorkflow.add('trainer');
                                            newWorkflow.add('data');
                                            newWorkflow.add('tokenise');
                                            newWorkflow.add('tokeniser');
                                        } else {
                                            newWorkflow.delete('trainer');
                                            newWorkflow.delete('data');
                                            newWorkflow.delete('tokenise');
                                            newWorkflow.delete('tokeniser');
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
                                checked={workflow.has('finetune')}
                                onChange={(_, checked) =>
                                    setWorkflow((old) => {
                                        const newWorkflow = new Set(old);
                                        if (checked) {
                                            newWorkflow.add('finetune');
                                            newWorkflow.add('conversations');
                                            newWorkflow.add('generator');
                                        } else {
                                            newWorkflow.delete('conversations');
                                            newWorkflow.delete('finetune');
                                            newWorkflow.delete('generator');
                                        }
                                        return newWorkflow;
                                    })
                                }
                            />
                        }
                        label={t('app.settings.showFinetune')}
                    />
                </fieldset>
                <div className={style.spacer} />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={compactMode}
                            onChange={(_, checked) => setCompactMode(checked)}
                        />
                    }
                    label={t('app.settings.compactMode')}
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={saveCheckpoints}
                            onChange={(_, checked) => setSaveCheckpoints(checked)}
                        />
                    }
                    label={t('app.settings.saveModelCheckpoints')}
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={developerMode}
                            onChange={(_, checked) => setDeveloperMode(checked)}
                        />
                    }
                    label={t('app.settings.developerMode')}
                />
            </div>
        </div>
    );
}
