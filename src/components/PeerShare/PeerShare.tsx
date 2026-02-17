import { useAtomValue } from 'jotai';
import { Peer } from '@genai-fi/base/hooks/peer';
import ChatProtocol from './ChatProtocol';
import { sessionCode } from '../../state/share';
import { ConnectionStatus } from '@genai-fi/base';
import style from './style.module.css';

export default function PeerShare() {
    const code = useAtomValue(sessionCode);

    return (
        <Peer
            host={import.meta.env.VITE_APP_PEER_SERVER}
            secure={import.meta.env.VITE_APP_PEER_SECURE === '1'}
            peerkey={import.meta.env.VITE_APP_PEER_KEY || 'peerjs'}
            port={import.meta.env.VITE_APP_PEER_PORT ? parseInt(import.meta.env.VITE_APP_PEER_PORT) : 443}
            code={`lm-${code}`}
        >
            <div className={style.status}>
                <ConnectionStatus
                    api={import.meta.env.VITE_APP_PEER_URL}
                    checkURL={import.meta.env.VITE_APP_API}
                    appName="lm"
                    visibility={0}
                />
            </div>
            <ChatProtocol />
        </Peer>
    );
}
