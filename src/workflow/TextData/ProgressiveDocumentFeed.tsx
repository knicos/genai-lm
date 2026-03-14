import { useCallback, useEffect, useRef, useState } from 'react';
import { DataEntry } from '../../state/data';
import style from './ProgressiveDocumentFeed.module.css';
import { useTranslation } from 'react-i18next';
import DocumentEntry from './DocumentEntry';

interface Props {
    data: DataEntry[];
    initialCount?: number;
    step?: number;
    rootMargin?: string;
    onUpdate: () => void;
}

interface Cursor {
    entryIndex: number;
    contentIndex: number;
}

interface DocRef {
    key: string;
    entryIndex: number;
    contentIndex: number;
}

function normalizeCursor(data: DataEntry[], cursor: Cursor): Cursor {
    let { entryIndex, contentIndex } = cursor;

    while (entryIndex < data.length) {
        const len = data[entryIndex]?.content.length ?? 0;
        if (contentIndex < len) return { entryIndex, contentIndex };
        entryIndex += 1;
        contentIndex = 0;
    }

    return { entryIndex: data.length, contentIndex: 0 };
}

function takeNextDocs(data: DataEntry[], start: Cursor, count: number) {
    const docs: DocRef[] = [];
    let cursor = normalizeCursor(data, start);

    while (docs.length < count && cursor.entryIndex < data.length) {
        const entry = data[cursor.entryIndex];
        const text = entry?.content[cursor.contentIndex];

        docs.push({
            key: `${entry.id}-${cursor.contentIndex}`,
            entryIndex: cursor.entryIndex,
            contentIndex: cursor.contentIndex,
        });

        cursor = normalizeCursor(data, {
            entryIndex: cursor.entryIndex,
            contentIndex: cursor.contentIndex + 1,
        });

        // guard in case of unexpected holes
        if (typeof text !== 'string') {
            cursor = normalizeCursor(data, {
                entryIndex: cursor.entryIndex + 1,
                contentIndex: 0,
            });
        }
    }

    const hasMore = normalizeCursor(data, cursor).entryIndex < data.length;
    return { docs, nextCursor: cursor, hasMore };
}

export default function ProgressiveDocumentFeed({
    data,
    initialCount = 8,
    step = 6,
    rootMargin = '800px',
    onUpdate,
}: Props) {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const cursorRef = useRef<Cursor>({ entryIndex: 0, contentIndex: 0 });
    const loadingRef = useRef(false);

    const [visibleDocs, setVisibleDocs] = useState<DocRef[]>([]);
    const [hasMore, setHasMore] = useState(false);

    const loadMore = useCallback(
        (count = step, replace = false) => {
            if (loadingRef.current) return;
            loadingRef.current = true;

            requestAnimationFrame(() => {
                const { docs, nextCursor, hasMore: more } = takeNextDocs(data, cursorRef.current, count);

                cursorRef.current = nextCursor;
                setVisibleDocs((prev) => (replace ? docs : [...prev, ...docs]));
                setHasMore(more);
                loadingRef.current = false;
            });
        },
        [data, step]
    );

    // Reset and seed when data changes (safe for edits/deletes/appends)
    useEffect(() => {
        cursorRef.current = { entryIndex: 0, contentIndex: 0 };
        setVisibleDocs([]);

        const start = normalizeCursor(data, cursorRef.current);
        const canLoad = start.entryIndex < data.length;
        setHasMore(canLoad);

        if (canLoad) loadMore(initialCount, true);
    }, [data, initialCount, loadMore]);

    useEffect(() => {
        const root = containerRef.current;
        const target = sentinelRef.current;
        if (!root || !target) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && hasMore) {
                    loadMore(step);
                }
            },
            { root, rootMargin, threshold: 0 }
        );

        observer.observe(target);
        return () => observer.disconnect();
    }, [hasMore, loadMore, rootMargin, step]);

    return (
        <div
            ref={containerRef}
            className={style.feed}
            role="feed"
            aria-busy={hasMore}
        >
            {visibleDocs.map((doc) => (
                <DocumentEntry
                    key={doc.key}
                    data={data}
                    doc={doc}
                    onUpdate={onUpdate}
                />
            ))}

            <div
                ref={sentinelRef}
                className={style.sentinel}
            />
            {hasMore && <div className={style.loading}>{t('data.loadingMoreDocuments')}</div>}
        </div>
    );
}
