import { useEffect, useRef } from 'react';

export default function useWakeLock(lock: boolean) {
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    useEffect(() => {
        if (!('wakeLock' in navigator)) {
            return;
        }

        async function requestWakeLock() {
            if (wakeLockRef.current) {
                await wakeLockRef.current.release();
                wakeLockRef.current = null;
            }
            try {
                const wakeLock = await navigator.wakeLock.request('screen');
                if (!wakeLock) return;
                wakeLockRef.current = wakeLock;
                wakeLock.addEventListener('release', () => {
                    wakeLockRef.current = null;
                });
            } catch (err) {
                console.error(err);
            }
        }

        if (lock) {
            requestWakeLock();

            const h = async () => {
                if (wakeLockRef.current === null && document.visibilityState === 'visible') {
                    await requestWakeLock();
                }
            };

            document.addEventListener('visibilitychange', h);

            return () => {
                document.removeEventListener('visibilitychange', h);
                if (wakeLockRef.current) {
                    wakeLockRef.current.release();
                    wakeLockRef.current = null;
                }
            };
        } else {
            if (wakeLockRef.current) {
                wakeLockRef.current.release();
                wakeLockRef.current = null;
            }
        }
    }, [lock]);
}
