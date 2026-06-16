import { describe, it, vi } from 'vitest';
import renderWithContexts from '../../utilities/renderWithContexts';
import { Component as Workspace } from './index';

vi.mock('./stages/DeploymentFrame', () => ({ default: () => <div>DeploymentFrame</div> }));
vi.mock('./stages/FinetuneFrame', () => ({ default: () => <div>FinetuneFrame</div> }));
vi.mock('./stages/PretrainFrame', () => ({ default: () => <div>PretrainFrame</div> }));
vi.mock('./stages/DataFrame', () => ({ default: () => <div>DataFrame</div> }));
vi.mock('./stages/ModelFrame', () => ({ default: () => <div>ModelFrame</div> }));
vi.mock('../../components/AppBar', () => ({ default: () => <div>AppBar</div> }));
vi.mock('../../components/DeviceProbe/DeviceProbe', () => ({ default: () => <div>DeviceProbe</div> }));
vi.mock('../../components/SettingsDialog/SettingsDialog', () => ({ default: () => <div>SettingsDialog</div> }));
vi.mock('../../components/PeerShare/PeerShareWrap', () => ({ default: () => <div>PeerShareWrap</div> }));
vi.mock('./Initialiser', () => ({ default: () => <div>Initialiser</div> }));
vi.mock('./Home', () => ({ default: () => <div>Home</div> }));
vi.mock('../../workflow/ModelState/ModelState', () => ({ default: () => <div>ModelState</div> }));

describe('Workspace view', () => {
    it('renders', ({ expect }) => {
        renderWithContexts(<Workspace />, { withWorkflow: true });
        expect(document.body).toBeInTheDocument();
    });
});
