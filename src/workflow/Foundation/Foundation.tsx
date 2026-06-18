import { useAtomValue } from 'jotai';
import Box from '../../components/BoxTitle/Box';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import { loadedModelAtom } from '../../state/model';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import SearchDiagContent from '../../components/ModelSearch/SearchDiagContent';

export default function Foundation() {
    const { t } = useTranslation();
    const model = useAtomValue(loadedModelAtom);

    return (
        <Box
            widget="foundation"
            active={model !== null}
            style={{ maxWidth: '1000px', maxHeight: '80%' }}
            disableHiding
        >
            <div className={style.container}>
                <BoxTitle
                    title={t('foundation.title')}
                    status={model ? 'done' : 'waiting'}
                />
                <div className={style.content}>
                    <SearchDiagContent
                        trained={true}
                        allowFileOpen
                    />
                </div>
            </div>
        </Box>
    );
}
