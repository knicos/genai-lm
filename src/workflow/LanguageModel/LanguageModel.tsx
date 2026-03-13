import { useAtom, useAtomValue } from 'jotai';
import style from './style.module.css';
import Box from '../../components/BoxTitle/Box';
import ModelMenu from './ModelMenu';
import { useRef, useState } from 'react';
import Tools from './Tools';
import { modelAtom, modelConfigAtom } from '../../state/model';
import SearchUntrained from './SearchUntrained';
import Architecture, { ArchitectureRef } from '../../components/Architecture/Architecture';
import { useNavigate } from 'react-router-dom';
import { IconButton } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import Help from '../../components/Help/Help';
import { useTranslation } from 'react-i18next';

export default function LanguageModel() {
    const { t } = useTranslation();
    const [config, setConfig] = useAtom(modelConfigAtom);
    const [showSearch, setShowSearch] = useState(false);
    const [showTools, setShowTools] = useState(false);
    const navigate = useNavigate();
    const archRef = useRef<ArchitectureRef>(null);
    const model = useAtomValue(modelAtom);

    return (
        <Box
            widget="thread"
            active={true}
            className={style.modelThread}
            fullWidth
        >
            {showSearch && (
                <SearchUntrained
                    onClose={() => setShowSearch(false)}
                    onConfig={(newConfig) => {
                        setConfig(newConfig);

                        setTimeout(() => {
                            archRef.current?.zoomToFit();
                        }, 0);
                    }}
                    config={config}
                />
            )}
            {showTools && <Tools onClose={() => setShowTools(false)} />}
            <div className={style.container}>
                <ModelMenu
                    onSearch={() => setShowSearch(true)}
                    onShowSettings={() => navigate('arch-settings')}
                    onReset={() => {
                        if (model?.loaded) {
                            setConfig(model.config);
                            setTimeout(() => {
                                archRef.current?.zoomToFit();
                            }, 0);
                        }
                    }}
                />
                <Help
                    message={t('model.visualHelp')}
                    style={{ width: '100%', height: '100%', overflow: 'hidden' }}
                    inside
                >
                    <Architecture ref={archRef} />
                </Help>
                <div className={style.zoomControls}>
                    <IconButton onClick={() => archRef.current?.zoomIn()}>
                        <ZoomInIcon />
                    </IconButton>
                    <IconButton onClick={() => archRef.current?.zoomOut()}>
                        <ZoomOutIcon />
                    </IconButton>
                </div>
            </div>
        </Box>
    );
}
