import { useAtom, useAtomValue } from 'jotai';
import useModelLoaded from '../../hooks/useModelLoaded';
import style from './style.module.css';
import Box from '../../components/BoxTitle/Box';
import ModelMenu from './ModelMenu';
import { useState } from 'react';
import { modelAtom, modelConfigAtom } from '../../state/model';
import { useNavigate } from 'react-router';
import { Help } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';
import ModelSearch from '../../components/ModelSearch/ModelSearch';
import { trainingAnimation } from '../../state/animations';
import ArchitectureDialog from './ArchDialog';
import ModelInfo from './ModelInfo';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import BuildModel, { isConfigEqual } from './BuildModel';

export default function ModelDesign() {
    const { t } = useTranslation();
    const [config, setConfig] = useAtom(modelConfigAtom);
    const [showSearch, setShowSearch] = useState(false);
    const navigate = useNavigate();
    const model = useAtomValue(modelAtom);
    const istraining = useAtomValue(trainingAnimation);
    const [showArchDialog, setShowArchDialog] = useState(false);
    const ready = useModelLoaded(model ?? undefined);

    const isUpToDate = !!model && ready && isConfigEqual(model.config, config);

    return (
        <Help
            widget="thread"
            message={t('model.archHelp')}
            active={isUpToDate}
            keepOpen
            placement="right"
            style={{ marginLeft: '2rem' }}
        >
            <Box
                widget="thread"
                active={isUpToDate}
                style={{ width: '30rem', minHeight: '300px' }}
                disabled={istraining}
                deactivateOnAudit
                useParent
            >
                {showSearch && (
                    <ModelSearch
                        trained={false}
                        onClose={() => setShowSearch(false)}
                        onConfig={(newConfig) => {
                            setConfig(newConfig);
                        }}
                        config={config}
                    />
                )}
                <div className={style.container}>
                    <BoxTitle
                        title={t('model.titleDesign')}
                        status={isUpToDate ? 'done' : 'waiting'}
                        onSettings={() => navigate('arch-settings')}
                    />
                    <ModelMenu
                        onSearch={() => setShowSearch(true)}
                        onEdit={() => setShowArchDialog(true)}
                        onUndo={isUpToDate || !model ? undefined : () => setConfig(model.config)}
                    />
                    <ModelInfo config={config} />
                    <BuildModel />
                    <ArchitectureDialog
                        open={showArchDialog}
                        onClose={() => setShowArchDialog(false)}
                    />
                </div>
            </Box>
        </Help>
    );
}
