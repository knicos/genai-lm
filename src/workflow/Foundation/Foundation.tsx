import { useAtomValue } from 'jotai';
import Box from '../../components/BoxTitle/Box';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import { loadedModelAtom } from '../../state/model';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import SearchContent from '../../components/ModelSearch/SearchContent';
import { useEffect, useState } from 'react';
import { ModelCardItem } from '../../components/ModelCard/type';
import { RowSet } from '../../components/CardRow/CardRow';
import { MANIFEST_URL } from '../../workflow/ModelState/SearchPretrained';
import { ModelManifest } from '../../components/ModelSearch/manifest';
import { groupByCategory } from '../../components/ModelSearch/grouping';

export default function Foundation() {
    const { t } = useTranslation();
    const model = useAtomValue(loadedModelAtom);
    const { i18n } = useTranslation();
    const [lang, setLang] = useState(i18n.language.split('-')[0]);
    const [langs, setLangs] = useState<{ code: string; name: string }[]>([]);
    const [dataRows, setDataRows] = useState<RowSet<ModelCardItem>[]>([]);

    useEffect(() => {
        fetch(MANIFEST_URL)
            .then((res) => res.json())
            .then((data: ModelManifest) => {
                const newRows = groupByCategory(lang, data);
                setDataRows(newRows);
                setLangs(Object.entries(data.languages).map(([code, name]) => ({ code, name })));
            })
            .catch(() => setDataRows([]));
    }, [lang]);

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
                    <SearchContent
                        dataRows={dataRows}
                        langs={langs}
                        lang={lang}
                        setLang={setLang}
                        allowFileOpen
                    />
                </div>
            </div>
        </Box>
    );
}
