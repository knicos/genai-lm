import { useAtomValue } from 'jotai';
import useModelLoaded from '../../hooks/useModelLoaded';
import style from './style.module.css';
import Box from '../../components/BoxTitle/Box';
import ModelMenu from './ModelMenu';
import { useState } from 'react';
import { modelAtom, modelDownloadAtom } from '../../state/model';
import { Help, Spinner } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';
import ModelSearch from '../../components/ModelSearch/ModelSearch';
import { trainingAnimation } from '../../state/animations';
import ModelInfo from '../ModelDesign/ModelInfo';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import DownloadProgress from '../../components/DownloadProgress/DownloadProgress';
import { Alert } from '@mui/material';

export default function Foundation() {
    const { t } = useTranslation();
    const [showSearch, setShowSearch] = useState(false);
    const model = useAtomValue(modelAtom);
    const istraining = useAtomValue(trainingAnimation);
    const ready = useModelLoaded(model ?? undefined);
    const downloader = useAtomValue(modelDownloadAtom);

    const config = ready && model ? model.config : undefined;

    const isUpToDate = ready && config ? true : false;

    return (
        <Help
            widget="foundation"
            message={t('foundation.help')}
            active={isUpToDate}
            keepOpen
            placement="right"
            style={{ marginLeft: '2rem' }}
        >
            <Box
                widget="foundation"
                active={isUpToDate}
                style={{ width: '30rem', minHeight: '300px' }}
                disabled={istraining}
                deactivateOnAudit
                useParent
            >
                {showSearch && (
                    <ModelSearch
                        trained={true}
                        onClose={() => setShowSearch(false)}
                        config={config}
                    />
                )}
                <div className={style.container}>
                    <BoxTitle
                        title={t('foundation.title')}
                        status={isUpToDate ? 'done' : 'waiting'}
                    />
                    <ModelMenu
                        onSearch={() => setShowSearch(true)}
                        onUpload={() => {}}
                    />
                    {!model && !downloader && (
                        <div className={style.infoBox}>
                            <Alert severity="info">{t('foundation.noModel')}</Alert>
                        </div>
                    )}
                    {!model && downloader && (
                        <div className={style.infoBox}>
                            <DownloadProgress downloads={downloader} />
                        </div>
                    )}
                    {model && !ready && (
                        <div className={style.infoBox}>
                            <Spinner size="large" />
                        </div>
                    )}
                    <ModelInfo
                        config={config ?? null}
                        model={ready ? model : null}
                        asTrained
                    />
                </div>
            </Box>
        </Help>
    );
}
