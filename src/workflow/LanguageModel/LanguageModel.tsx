import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import style from './style.module.css';
import Box from '../../components/BoxTitle/Box';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import ModelMenu from './ModelMenu';
import { useState } from 'react';
import Tools from './Tools';
import { modelConfigAtom } from '../../state/model';
import SearchUntrained from './SearchUntrained';
import Architecture from '../../components/Architecture/Architecture';
import { useNavigate } from 'react-router-dom';
// import useModelLoaded from '../../utilities/useModelLoaded';

export default function LanguageModel() {
    const { t } = useTranslation();
    const [config, setConfig] = useAtom(modelConfigAtom);
    const [showSearch, setShowSearch] = useState(false);
    const [showTools, setShowTools] = useState(false);
    const [zoom, setZoom] = useState<number>(6);
    const navigate = useNavigate();

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
                    onConfig={setConfig}
                    config={config}
                />
            )}
            {showTools && <Tools onClose={() => setShowTools(false)} />}
            <div className={style.container}>
                <BoxTitle
                    title={t('model.title')}
                    status={'done'}
                    placeholder={t('model.languageModel')}
                    dark
                />
                <ModelMenu
                    onSearch={() => setShowSearch(true)}
                    onZoomIn={() => setZoom((prev) => prev - 1)}
                    onZoomOut={() => setZoom((prev) => prev + 1)}
                    onShowSettings={() => navigate('arch-settings')}
                />
                <Architecture
                    architecture={config}
                    zoom={zoom}
                />
            </div>
        </Box>
    );
}
