import { RowSet } from '../CardRow/CardRow';
import { ModelCardItem } from '../ModelCard/type';
import { ModelManifest } from './manifest';

export function groupByCategory(lang: string, manifest: ModelManifest | null): RowSet<ModelCardItem>[] {
    if (!manifest) return [];
    const itemMap = new Map(manifest.models.map((item) => [item.id, item]));
    return (manifest.categories[lang] || []).map((cat) => ({
        title: cat.name,
        cards: cat.modelIds.map((id) => itemMap.get(id)).filter((item): item is ModelCardItem => item !== undefined),
    }));
}
