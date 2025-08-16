import { useMemo, useState } from 'react';
import style from './style.module.css';
import { Alert, IconButton } from '@mui/material';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import BoxTitle from '../BoxTitle/BoxTitle';
import prettyNumber from '../../utilities/prettyNumber';
import BoxMenu from '../BoxTitle/BoxMenu';
import { useTranslation } from 'react-i18next';

const PADDING = 10;

interface Props {
    samples: string[];
    contextSize: number;
    parameters?: number;
}

interface SampleItem {
    prefix: string;
    text: string;
    token: string;
    suffix: string;
    index: number;
}

function requiredSamples(parameters: number) {
    return 10 * parameters;
}

export default function SampleViewer({ samples, contextSize, parameters }: Props) {
    const { t } = useTranslation();
    const [index, setIndex] = useState(0);

    const joinedSamples = useMemo(() => {
        return samples.join('\n');
    }, [samples]);

    const sample: SampleItem = useMemo(() => {
        const start = Math.max(0, index - PADDING);
        const end = index + contextSize;
        return {
            prefix: joinedSamples.slice(start, index),
            text: joinedSamples.slice(start + PADDING, end),
            suffix: joinedSamples.slice(end + 1, end + 1 + PADDING),
            index,
            token: joinedSamples.slice(end, end + 1),
        };
    }, [joinedSamples, index, contextSize]);

    return (
        <div className={style.container}>
            <BoxTitle
                title={t('samples.title')}
                info
                done={samples.length > 0}
            />
            <BoxMenu>
                <div>
                    <span className={style.bold}>{t('samples.total')}: </span>
                    {`${prettyNumber(joinedSamples?.length || 0)}`}
                </div>
                <IconButton
                    color="secondary"
                    disabled={samples.length === 0}
                    onClick={() => setIndex(Math.random() * (joinedSamples.length - contextSize - 1))}
                >
                    <ShuffleIcon />
                </IconButton>
            </BoxMenu>
            {samples.length > 0 && (
                <div className={style.sample}>
                    <span className={style.prefix}>{sample.prefix}</span>
                    <span className={style.text}>{sample.text}</span>
                    <span className={style.token}>{sample.token}</span>
                    <span className={style.suffix}>{sample.suffix}</span>
                </div>
            )}
            {samples.length === 0 && (
                <div className={style.sample}>
                    <Alert severity="warning">{t('samples.noSamples')}</Alert>
                </div>
            )}
            {samples.length > 0 && joinedSamples.length < requiredSamples(parameters || 0) && (
                <div className={style.sample}>
                    <Alert severity="info">{t('samples.moreSamples')}</Alert>
                </div>
            )}
        </div>
    );
}
