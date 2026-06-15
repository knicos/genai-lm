import { useAtom, useAtomValue } from 'jotai';
import { loadedModelAtom, modelLoRAName } from '../../state/model';
import style from './style.module.css';
import { useTranslation } from 'react-i18next';
import { enableSharing, sessionCode } from '../../state/share';
import { QRCode, randomId, VerticalButton, Button } from '@genai-fi/base';
import { BoxButton } from '../../components/BoxButton/BoxButton';
import ShareIcon from '@mui/icons-material/Share';
import { Dialog, DialogContent, DialogTitle, FormControlLabel, MenuItem, Select, Switch } from '@mui/material';
import { useCallback, useState } from 'react';
import DownloadIcon from '@mui/icons-material/Download';
import { saveAs } from 'file-saver';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { allowRecordAtom } from '../../state/data';
import { workflowSteps } from '../../state/workflowSettings';
import ExtensionIcon from '@mui/icons-material/Extension';

interface Props {
    withLoRA?: boolean;
}

export default function Sharing({ withLoRA }: Props) {
    const { t } = useTranslation();
    const model = useAtomValue(loadedModelAtom);
    const [sharing, setSharing] = useAtom(enableSharing);
    const [allowRecord, setAllowRecord] = useAtom(allowRecordAtom);
    //const status = useModelStatus(model ?? undefined);
    const [code, setCode] = useAtom(sessionCode);
    const [showDialog, setShowDialog] = useState(false);
    const loraName = useAtomValue(modelLoRAName);
    const steps = useAtomValue(workflowSteps);
    const [selectedLoRA, setSelectedLoRA] = useState<string>(loraName || '');

    const doSave = useCallback(
        (name: string) => {
            model
                ?.saveModel({ name })
                .then((blob) => {
                    saveAs(blob, `${name}.zip`);
                })
                .catch((e) => {
                    console.error('Error saving model:', e);
                });
        },
        [model]
    );

    const url =
        withLoRA && selectedLoRA.length > 0
            ? `${window.location.origin}/app/${code}?lora=${selectedLoRA}`
            : `${window.location.origin}/app/${code}`;

    const loRAList = model?.listLoRAs();

    return (
        <>
            <BoxButton
                widget={withLoRA ? 'sharing' : 'sharing-raw'}
                light
                label={t('sharing.title')}
                icon={<ShareIcon />}
                onClick={() => setShowDialog(true)}
            />
            <Dialog
                open={showDialog}
                onClose={() => setShowDialog(false)}
                maxWidth="md"
            >
                <DialogTitle>{t(withLoRA ? 'sharing.titleLoRA' : 'sharing.titlePre')}</DialogTitle>
                <DialogContent>
                    <div className={style.container}>
                        <div className={style.leftColumn}>
                            <div className={style.shareOption}>
                                <div className={style.optionNumber}>1</div>
                                <div>
                                    <h3>{t('sharing.option1')}</h3>
                                    <p>{t('sharing.option1_desc')}</p>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={sharing}
                                                onChange={() => {
                                                    if (!sharing) {
                                                        setCode(randomId(8));
                                                    }
                                                    setSharing(!sharing);
                                                }}
                                                disabled={!model}
                                            />
                                        }
                                        label={t('sharing.enable')}
                                    />
                                    {steps.has('conversations') && (
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={allowRecord}
                                                    onChange={() => {
                                                        setAllowRecord(!allowRecord);
                                                    }}
                                                    disabled={!model}
                                                />
                                            }
                                            label={t('sharing.allowRecord')}
                                        />
                                    )}
                                </div>
                            </div>
                            <div className={style.shareOption}>
                                <div className={style.optionNumber}>2</div>
                                <div>
                                    <h3>{t('sharing.option2')}</h3>
                                    <p>{t('sharing.option2_desc')}</p>
                                    <VerticalButton
                                        startIcon={<DownloadIcon />}
                                        color="primary"
                                        disabled={!model}
                                        onClick={() => doSave(model?.meta.name || 'model')}
                                    >
                                        {t('sharing.download')}
                                    </VerticalButton>
                                </div>
                            </div>
                        </div>
                        <div className={`${style.qr} ${!sharing ? style.disabled : ''}`}>
                            {withLoRA && (
                                <div className={style.loraBadge}>
                                    <Select
                                        size="small"
                                        startAdornment={<ExtensionIcon sx={{ mr: 1 }} />}
                                        value={selectedLoRA}
                                        onChange={(e) => setSelectedLoRA(e.target.value)}
                                    >
                                        <MenuItem
                                            key="none"
                                            value=""
                                        >
                                            {t('sharing.noLoRA')}
                                        </MenuItem>
                                        {loRAList?.map((lora) => (
                                            <MenuItem
                                                key={lora}
                                                value={lora}
                                            >
                                                {lora}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </div>
                            )}
                            <QRCode
                                url={url}
                                size="normal"
                            />
                            <Button
                                startIcon={<ContentCopyIcon />}
                                variant="outlined"
                                onClick={() => navigator.clipboard.writeText(url)}
                            >
                                {t('sharing.copyLink')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
