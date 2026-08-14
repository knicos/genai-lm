import { useAtom, useAtomValue } from 'jotai';
import { trainerSettings, pftSettings, trainingModeAtom, tunerSettings } from '../../state/trainer';
import { SettingsForm } from './SettingsForm';

export function Component() {
    const [settings, setSettings] = useAtom(trainerSettings);
    const [partialSettings, setPartialSettings] = useAtom(pftSettings);
    const [fineSettings, setFineSettings] = useAtom(tunerSettings);
    const mode = useAtomValue(trainingModeAtom);

    const realSettings = mode === 'partial' ? partialSettings : mode === 'lora' ? fineSettings : settings;
    const realSet = mode === 'partial' ? setPartialSettings : mode === 'lora' ? setFineSettings : setSettings;

    return (
        <SettingsForm
            settings={realSettings}
            setSettings={realSet}
        />
    );
}
