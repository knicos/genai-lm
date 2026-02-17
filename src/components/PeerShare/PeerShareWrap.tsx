import { useAtomValue } from 'jotai';
import { enableSharing } from '../../state/share';
import PeerShare from './PeerShare';

export default function PeerShareWrap() {
    const share = useAtomValue(enableSharing);
    if (!share) return null;
    return <PeerShare />;
}
