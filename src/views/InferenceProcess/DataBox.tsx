import MarginIcon from '@mui/icons-material/Margin';
import style from './databox.module.css';
import { theme } from '../../theme';
import { Help } from '@genai-fi/base';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { dataTokens } from '../../state/data';
import prettyNumber from '../../utilities/prettyNumber';
import { useChangePathString } from '../../hooks/useChangePath';
import { Link } from 'react-router-dom';

const DATA_RADIUS = 72 / 2;

interface Props {
    inferenceMode?: boolean;
}

export default function DataBox({ inferenceMode = false }: Props) {
    const { t } = useTranslation();
    const data = useAtomValue(dataTokens);
    const dataURL = useChangePathString({ sidepanel: 'tokenised-data' });

    return (
        <div className={style.container}>
            <div className={style.row}>
                <div className={`${style.icon} ${inferenceMode ? style.inferenceIcon : ''}`}>
                    <Link to={dataURL}>
                        <MarginIcon
                            fontSize="large"
                            color="inherit"
                        />
                    </Link>
                </div>

                <Help
                    message={t('tools.dataHelp')}
                    inplace
                    dark
                >
                    <div className={style.dataLabel}>
                        <h3>
                            {t('tools.data')} (
                            {inferenceMode
                                ? t('tools.dataUnused')
                                : t('tools.ntokens', { N: prettyNumber(data?.length ?? 0, t) })}
                            )
                        </h3>
                    </div>
                </Help>
            </div>
            <svg
                className={style.linesSVG}
                xmlns="http://www.w3.org/2000/svg"
                width={`${DATA_RADIUS * 2}px`}
                height="40px"
            >
                {!inferenceMode && (
                    <line
                        x1={DATA_RADIUS}
                        y1="0"
                        x2={DATA_RADIUS}
                        y2="40"
                        stroke="white"
                        strokeWidth="5"
                    />
                )}
                {inferenceMode && (
                    <>
                        <line
                            x1={DATA_RADIUS}
                            y1="0"
                            x2={DATA_RADIUS}
                            y2="15"
                            stroke="white"
                            strokeWidth="5"
                        />
                        <line
                            x1={DATA_RADIUS}
                            y1="25"
                            x2={DATA_RADIUS}
                            y2="40"
                            stroke="white"
                            strokeWidth="5"
                        />
                        <line
                            x1={DATA_RADIUS - 8}
                            y1="18"
                            x2={DATA_RADIUS + 8}
                            y2="15"
                            stroke={theme.dark.error}
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                        <line
                            x1={DATA_RADIUS - 8}
                            y1="25"
                            x2={DATA_RADIUS + 8}
                            y2="22"
                            stroke={theme.dark.error}
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                    </>
                )}
            </svg>
        </div>
    );
}
