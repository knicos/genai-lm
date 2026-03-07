import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { modelAtom } from '../../state/model';
import style from './style.module.css';
import { useMemo, useState } from 'react';
import { Alert, FormControlLabel, Slider, Switch } from '@mui/material';
import { dataTokens } from '../../state/data';
import { theme } from '../../theme';

const BLOCK_SIZE = 200;
const STEP = 10; // offset step for wheel/keys

export function Component() {
    const { t } = useTranslation();
    const model = useAtomValue(modelAtom);
    const data = useAtomValue(dataTokens);
    const [showNumbers, setShowNumbers] = useState(false);
    const [sliceIndex, setSliceIndex] = useState(0);
    const [selectedToken, setSelectedToken] = useState<number>(-1);

    const tokeniser = model?.tokeniser;
    const dataLength = data?.length ?? 0;
    const maxStart = Math.max(0, dataLength - BLOCK_SIZE);

    const clampedSliceIndex = Math.min(sliceIndex, maxStart);

    const slicedData = useMemo(
        () => Array.from(data?.slice(clampedSliceIndex, clampedSliceIndex + BLOCK_SIZE) ?? []),
        [data, clampedSliceIndex]
    );

    const tokens = useMemo(
        () => slicedData.map((v: number) => ({ label: tokeniser?.decode([v]) ?? '', value: v })),
        [slicedData, tokeniser]
    );

    const moveBy = (delta: number) => {
        setSliceIndex((prev) => Math.max(0, Math.min(maxStart, prev + delta)));
    };

    return (
        <div className="sidePanel">
            <h2>{t('tokeniseData.sideTitle')}</h2>

            <FormControlLabel
                control={
                    <Switch
                        checked={showNumbers}
                        onChange={(_, checked) => setShowNumbers(checked)}
                    />
                }
                label={t('tokeniseData.showNumbers')}
            />

            <Slider
                value={clampedSliceIndex}
                min={0}
                max={maxStart}
                step={STEP}
                onChange={(_, v) => setSliceIndex(Array.isArray(v) ? v[0] : v)}
                valueLabelDisplay="auto"
                aria-label="Token offset"
                style={{ marginTop: '2rem' }}
            />

            <div
                onWheel={(e) => {
                    // e.preventDefault();
                    moveBy(e.deltaY > 0 ? STEP : -STEP);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' || e.key === 'PageDown') moveBy(STEP);
                    if (e.key === 'ArrowUp' || e.key === 'PageUp') moveBy(-STEP);
                }}
                tabIndex={0}
                role="region"
                aria-label="Token viewer"
                className={style.tokenContainer}
            >
                <div className={style.tokenList}>
                    {tokens.length === 0 && (
                        <Alert
                            sx={{ margin: 'auto' }}
                            severity="info"
                        >
                            {t('tokeniseData.noData')}
                        </Alert>
                    )}
                    {tokens.map((token, i) => (
                        <div
                            key={`${clampedSliceIndex + i}-${token.value}`}
                            onMouseEnter={() => setSelectedToken(token.value)}
                            onMouseLeave={() => setSelectedToken(-1)}
                        >
                            <span
                                className={`${style.token} ${selectedToken === token.value ? style.selected : ''}`}
                                style={{
                                    borderColor:
                                        theme.light.chartColours[token.value % theme.light.chartColours.length],
                                }}
                            >
                                {showNumbers ? `${token.value}` : token.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
