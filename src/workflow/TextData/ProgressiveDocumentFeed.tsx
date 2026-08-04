import { useCallback, useEffect, useRef, useState } from 'react';
import { DataEntry } from '../../state/data';
import style from './ProgressiveDocumentFeed.module.css';
import { useTranslation } from 'react-i18next';
import DocumentEntry from './DocumentEntry';
import { ConversationCursor, Conversation } from '@genai-fi/nanogpt';

interface Props {
    data: DataEntry | DataEntry[];
    initialCount?: number;
    step?: number;
    rootMargin?: string;
}

interface Cursor {
    entryIndex: number;
    cursor: ConversationCursor | null;
    contentIndex: number;
}

interface DocRef {
    key: string;
    entryIndex: number;
    contentIndex: number;
    content: Conversation[];
}

async function nextDoc(data: DataEntry[], cursor: Cursor): Promise<Conversation[] | null> {
    while (cursor.entryIndex < data.length) {
        if (cursor.cursor === null) {
            cursor.cursor = (await data[cursor.entryIndex].stream).cursor();
            cursor.contentIndex = 0;
        } else {
            cursor.contentIndex += 1;
        }

        const next = await cursor.cursor.next();
        if (next) {
            return next;
        } else {
            cursor.entryIndex += 1;
            cursor.cursor = null;
        }
    }

    return null;
}

async function takeNextDocs(data: DataEntry[], start: Cursor, count: number) {
    const docs: DocRef[] = [];
    let hasMore = true;

    while (docs.length < count) {
        const next = await nextDoc(data, start);
        if (!next) {
            hasMore = false;
            break;
        }

        const entryId = data[start.entryIndex].id;

        docs.push({
            key: `${entryId}-${start.contentIndex}`,
            entryIndex: start.entryIndex,
            contentIndex: start.contentIndex,
            content: next,
        });
    }

    return { docs, nextCursor: start, hasMore };
}

export default function ProgressiveDocumentFeed({ data, initialCount = 8, step = 6, rootMargin = '800px' }: Props) {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const cursorRef = useRef<Cursor>({ entryIndex: 0, cursor: null, contentIndex: 0 });
    const loadingRef = useRef(false);

    const [visibleDocs, setVisibleDocs] = useState<DocRef[]>([]);
    const [hasMore, setHasMore] = useState(false);

    const dataArray = Array.isArray(data) ? data : [data];

    const loadMore = useCallback(
        (count = step, replace = false) => {
            if (loadingRef.current) return;
            loadingRef.current = true;
            const dataArray = Array.isArray(data) ? data : [data];

            requestAnimationFrame(async () => {
                const { docs, nextCursor, hasMore: more } = await takeNextDocs(dataArray, cursorRef.current, count);

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
        const dataArray = Array.isArray(data) ? data : [data];
        cursorRef.current = { entryIndex: 0, cursor: null, contentIndex: 0 };
        setVisibleDocs([]);

        const start = { entryIndex: 0, cursor: null, contentIndex: 0 };
        const canLoad = start.entryIndex < dataArray.length;
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
                    dataArray[doc.entryIndex] && (
                        <DocumentEntry
                            key={doc.key}
                            data={dataArray[doc.entryIndex]}
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
