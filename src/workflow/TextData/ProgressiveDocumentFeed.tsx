import { useCallback, useEffect, useRef, useState } from 'react';
import { DataEntry } from '../../state/data';
import style from './ProgressiveDocumentFeed.module.css';
import { useTranslation } from 'react-i18next';
import DocumentEntry from './DocumentEntry';
import { Conversation } from '@genai-fi/nanogpt';

interface Props {
    data: DataEntry | null;
    initialCount?: number;
    step?: number;
    rootMargin?: string;
}

interface Cursor {
    entryIndex: number;
    next: (() => Promise<boolean>) | null;
    contentIndex: number;
    docs: DocRef[];
}

interface DocRef {
    key: string;
    entryIndex: number;
    contentIndex: number;
    content: Conversation[];
}

async function nextDoc(data: DataEntry, cursor: Cursor, cb: (conv: Conversation[]) => void): Promise<boolean> {
    if (cursor.next === null) {
        cursor.next = await (await data.stream).step(cb);
        cursor.contentIndex = 0;
    }

    const hasMore = await cursor.next();
    return hasMore;
}

async function takeNextDocs(data: DataEntry, start: Cursor, count: number) {
    let hasMore = true;

    start.docs = [];

    while (start.docs.length < count && hasMore) {
        hasMore = await nextDoc(data, start, (conv) => {
            const entryId = data.id;
            start.contentIndex += 1;
            start.docs.push({
                key: `${entryId}-${start.contentIndex}`,
                entryIndex: start.entryIndex,
                contentIndex: start.contentIndex,
                content: conv,
            });
        });
    }

    return { docs: start.docs, nextCursor: start, hasMore };
}

export default function ProgressiveDocumentFeed({ data, initialCount = 8, step = 6, rootMargin = '800px' }: Props) {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const cursorRef = useRef<Cursor>({ entryIndex: 0, next: null, contentIndex: 0, docs: [] });
    const loadingRef = useRef(false);

    const [visibleDocs, setVisibleDocs] = useState<DocRef[]>([]);
    const [hasMore, setHasMore] = useState(false);

    const loadMore = useCallback(
        (count = step, replace = false) => {
            if (!data) return;
            if (loadingRef.current) return;
            loadingRef.current = true;

            requestAnimationFrame(async () => {
                if (!data) {
                    loadingRef.current = false;
                    return;
                }
                const { docs, nextCursor, hasMore: more } = await takeNextDocs(data, cursorRef.current, count);

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
        cursorRef.current = { entryIndex: 0, next: null, contentIndex: 0, docs: [] };
        setVisibleDocs([]);
        const canLoad = !!data;
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
            {visibleDocs.map(
                (doc) =>
                    data && (
                        <DocumentEntry
                            key={doc.key}
                            data={data}
                            doc={doc}
                        />
                    )
            )}

            <div
                ref={sentinelRef}
                className={style.sentinel}
            />
            {hasMore && <div className={style.loading}>{t('data.loadingMoreDocuments')}</div>}
        </div>
    );
}
