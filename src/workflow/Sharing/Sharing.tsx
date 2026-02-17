import { useAtom, useAtomValue } from 'jotai';
import Box from '../../components/BoxTitle/Box';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import { modelAtom } from '../../state/model';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import SharingMenu from './SharingMenu';
import useModelLoaded from '../../utilities/useModelLoaded';
import { enableSharing, sessionCode } from '../../state/share';
import { QRCode } from '@genai-fi/base';

export default function Sharing() {
    const { t } = useTranslation();
    const model = useAtomValue(modelAtom);
    const [sharing, setSharing] = useAtom(enableSharing);
    //const status = useModelStatus(model ?? undefined);
    const ready = useModelLoaded(model ?? undefined);
    const code = useAtomValue(sessionCode);

    return (
        <Box
            widget="sharing"
            active={ready}
            style={{ minWidth: '290px' }}
        >
            <div className={style.container}>
                <BoxTitle
                    title={t('sharing.title')}
                    status={'done'}
                />
                <SharingMenu
                    active={ready && sharing}
                    onStart={() => setSharing(true)}
                    onStop={() => setSharing(false)}
                    onShowSettings={() => {}}
                    onUsers={() => {}}
                />
                <div className={`${style.qr} ${!sharing ? style.disabled : ''}`}>
                    <QRCode
                        url={`${window.location.origin}/app/${code}`}
                        size="small"
                        dialog
                    />
                </div>
            </div>
        </Box>
    );
}
