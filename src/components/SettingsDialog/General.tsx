import { useAtom, useAtomValue } from 'jotai';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import { Checkbox, FormControlLabel } from '@mui/material';
import { LangSelect } from '@genai-fi/base';
import { workflowSteps } from '../../state/workflowSettings';
import { deviceHasWebGPU, deviceHasWebGL, devicePerformProbe } from '../../state/device';
import { uiDeveloperMode } from '../../state/uiState';

export default function GeneralSettings() {
    const { t } = useTranslation();
    const [workflow, setWorkflow] = useAtom(workflowSteps);
    const [performProbe, setPerformProbe] = useAtom(devicePerformProbe);
    const [developerMode, setDeveloperMode] = useAtom(uiDeveloperMode);
    const hasWebGPU = useAtomValue(deviceHasWebGPU);
    const hasWebGL = useAtomValue(deviceHasWebGL);

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
            <FormControlLabel
                control={
                    <Checkbox
                        checked={workflow.has('xai')}
                        onChange={(_, checked) =>
                            setWorkflow((old) => {
                                const newWorkflow = new Set(old);
                                if (checked) {
                                    newWorkflow.add('xai');
                                } else {
                                    newWorkflow.delete('xai');
                                }
                                return newWorkflow;
                            })
                        }
                    />
                }
                label={t('app.settings.showXAI')}
            />
            <div className={style.spacer} />
            <FormControlLabel
                control={
                    <Checkbox
                        checked={developerMode}
                        onChange={(_, checked) => setDeveloperMode(checked)}
                    />
                }
                label={t('app.settings.developerMode')}
            />
            <FormControlLabel
                control={
                    <Checkbox
                        checked={performProbe}
                        onChange={(_, checked) => setPerformProbe(checked)}
                    />
                }
                label={t('app.settings.performProbe')}
            />
            <div className={style.spacer} />
            <div>
                <div>WebGL: {hasWebGL ? 'Available' : 'Not Available'}</div>
                <div>WebGPU: {hasWebGPU ? 'Available' : 'Not Available'}</div>
            </div>
        </div>
    );
}
