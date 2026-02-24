import { useParams } from 'react-router-dom';
import { Peer } from '@genai-fi/base/hooks/peer';
import { useAtomValue } from 'jotai';
import { sessionCode } from '../../state/share';
import { ConnectionStatus } from '@genai-fi/base';
import style from './style.module.css';
import { EventProtocol } from '../../components/PeerShare/events';
import Page from './Page';

export function Component() {
    const { code } = useParams();
    const sessionCodeValue = useAtomValue(sessionCode);

    return (
        <main className={style.container}>
            <Peer<EventProtocol>
                host={import.meta.env.VITE_APP_PEER_SERVER}
                secure={import.meta.env.VITE_APP_PEER_SECURE === '1'}
                peerkey={import.meta.env.VITE_APP_PEER_KEY || 'peerjs'}
                port={import.meta.env.VITE_APP_PEER_PORT ? parseInt(import.meta.env.VITE_APP_PEER_PORT) : 443}
                server={`lm-${code}`}
                code={`lm-${sessionCodeValue}`}
            >
                <div className={style.status}>
                    <ConnectionStatus
                        api={import.meta.env.VITE_APP_PEER_URL}
                        checkURL={import.meta.env.VITE_APP_API}
                        appName="lm"
                        visibility={0}
                    />
                </div>
                <Page />
            </Peer>
        </main>
    );
}
