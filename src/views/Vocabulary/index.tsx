import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { modelAtom } from '../../state/model';
import style from './style.module.css';
import { MouseEvent, PointerEvent, useEffect, useMemo, useState } from 'react';
import { FormControlLabel, Switch } from '@mui/material';
import InfoPop from '../../components/InfoPop/InfoPop';

export function Component() {
    const { t } = useTranslation();
    const model = useAtomValue(modelAtom);
    const [anchor, setAnchor] = useState<null | HTMLElement>(null);
    const [selectedToken, setSelectedToken] = useState<number | null>(null);
    const [includeSpecial, setIncludeSpecial] = useState(false);
    const [vocab, setVocab] = useState<string[]>([]);

    const tokeniser = model?.tokeniser;

    useEffect(() => {
        if (tokeniser) {
            const h = () => {
                setVocab(tokeniser.getVocab() ?? []);
            };
            h();
            tokeniser.on('trainStatus', h);
            return () => {
                tokeniser.off('trainStatus', h);
            };
        }
    }, [tokeniser]);

    const filteredVocab = useMemo(
        () =>
            !vocab
                ? []
                : vocab
                      .map((t, index) => ({ token: t, index }))
                      .filter(
                          ({ token, index }) =>
                              token.trim() !== '' && (includeSpecial || tokeniser?.isSpecialToken(index) === false)
                      ),
        [vocab, includeSpecial, tokeniser]
    );

    return (
        <div className="sidePanel">
            <h2>{t('tokeniser.title')}</h2>
            <FormControlLabel
                control={
                    <Switch
                        checked={includeSpecial}
                        onChange={(_, checked) => setIncludeSpecial(checked)}
                    />
                }
                label={t('tokeniser.includeSpecial')}
            />
            <ul className={style.vocabList}>
                {filteredVocab.map(({ token, index }) => (
                    <li
                        key={token}
                        onClick={(e: MouseEvent<HTMLLIElement>) => {
                            setAnchor(e.target as HTMLElement);
                            setSelectedToken(index);
                        }}
                        onPointerEnter={(e: PointerEvent<HTMLElement>) => {
                            setAnchor(e.target as HTMLElement);
                            setSelectedToken(index);
                        }}
                        onPointerLeave={() => {
                            setAnchor(null);
                        }}
                    >
                        <span className={style.token}>{token}</span>
                    </li>
                ))}
            </ul>
            <InfoPop
                open={!!anchor}
                anchorEl={anchor}
                placement="bottom"
                sx={{ zIndex: 3 }}
            >
                <div className={style.popper}>{selectedToken}</div>
            </InfoPop>
        </div>
    );
}
