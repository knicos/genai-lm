import { useAtomValue, useSetAtom } from 'jotai';
import { loadedModelAtom } from '../../../state/model';
import { useEffect, useState } from 'react';
import type { WorkflowStage } from '../../../state/workflowSettings';
import Frame from '../Frame';
import FullSizeGroup from '../FullSizeGroup';
import style from '../style.module.css';
import { useTranslation } from 'react-i18next';
import RawGeneration from '../../../workflow/ChatOutput/RawGeneration';
import RawPrompt from '../../../workflow/Prompt/RawPrompt';
import { featureFlagsAtom, uiWhiteWorkspace } from '../../../state/uiState';
import DnDModel from '../../../components/DnDModel/DnDModel';
import ModelSearch from '../../../components/ModelSearch/ModelSearch';

interface Props {
    registerFrame: (flow: WorkflowStage, element: HTMLDivElement | null) => void;
}

export default function AuditFrame(props: Props) {
    const { t } = useTranslation();
    const { allowAudit } = useAtomValue(featureFlagsAtom);
    const setWhiteWorkspace = useSetAtom(uiWhiteWorkspace);
    const model = useAtomValue(loadedModelAtom);
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        setWhiteWorkspace(true);
        return () => setWhiteWorkspace(false);
    }, [setWhiteWorkspace]);

    if (!allowAudit) return null;

    return (
        <Frame
            name="audit"
            {...props}
        >
            <div className={style.titleColumn}>
                <FullSizeGroup
                    widget="chatOutput"
                    boxless
                >
                    {showSearch && (
                        <ModelSearch
                            onClose={() => setShowSearch(false)}
                            allowFileOpen
                            trained
                        />
                    )}
                    <RawGeneration
                        showAudit
                        onOpen={() => setShowSearch(true)}
                    />
                    {!!model && <RawPrompt initialMessage={t('audit.startPrompt')} />}
                    {!model && (
                        <div className={style.loadModel}>
                            <DnDModel onSearch={() => setShowSearch(true)} />
                        </div>
                    )}
                </FullSizeGroup>
            </div>
        </Frame>
    );
}
