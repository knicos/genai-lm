import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ModelManifest } from '../../components/ModelSearch/manifest';
import { groupByCategory } from '../../components/ModelSearch/grouping';
import { RowSet } from '../../components/CardRow/CardRow';
import { ModelCardItem } from '../../components/ModelCard/type';
import ModelSearch from '../../components/ModelSearch/ModelSearch';
import { ExtendedConfig } from '../../state/model';

export const MANIFEST_URL = 'https://store.gen-ai.fi/llm/untrainedManifest.json';

interface Props {
    config?: ExtendedConfig;
    onConfig?: (config: ExtendedConfig) => void;
    onClose: () => void;
}

export default function SearchUntrained({ onConfig, onClose, config }: Props) {
    const { i18n } = useTranslation();
    const [lang, setLang] = useState(i18n.language.split('-')[0]);
    const [langs, setLangs] = useState<{ code: string; name: string }[]>([]);
    const [dataRows, setDataRows] = useState<RowSet<ModelCardItem>[]>([]);

    useEffect(() => {
        fetch(MANIFEST_URL)
            .then((res) => res.json())
            .then((data: ModelManifest) => {
                setDataRows(groupByCategory(lang, data));
                setLangs(Object.entries(data.languages).map(([code, name]) => ({ code, name })));
            })
            .catch(() => setDataRows([]));
    }, [lang]);

    return (
        <ModelSearch
            config={config}
            onConfig={onConfig}
            onClose={onClose}
            dataRows={dataRows}
            langs={langs}
            setLang={setLang}
            lang={lang}
        />
    );
}
