import { TeachableLLM, waitForModel } from '@genai-fi/nanogpt';
import style from './style.module.css';
import BoxTitle from '../../components/BoxTitle/BoxTitle';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from '@mui/material';

interface Information {
    parameters: number;
    transformers: number;
    heads: number;
    embedding: number;
    context: number;
}

interface Props {
    model?: TeachableLLM;
}

export default function ModelInfo({ model }: Props) {
    const { t } = useTranslation();
    const [info, setInfo] = useState<Information | null>(null);

    useEffect(() => {
        if (model) {
            waitForModel(model).then(() => {
                setInfo({
                    parameters: model.getNumParams(),
                    transformers: model.config.nLayer,
                    heads: model.config.nHead,
                    embedding: model.config.nEmbed,
                    context: model.config.blockSize,
                });
            });
        }
    }, [model]);

    return (
        <div className={style.container}>
            <BoxTitle
                title={t('info.title')}
                status={model ? 'done' : 'info'}
            />
            <div className={style.innerContainer}>
                {!info && <Alert severity="info">{t('info.selectModel')}</Alert>}
                {info && (
                    <table className={style.info}>
                        <tbody>
                            <tr>
                                <td>{t('info.parameters')}:</td>
                                <td className={style.bold}>{(info.parameters / 1000000).toFixed(1)}M</td>
                            </tr>
                            <tr>
                                <td>{t('info.transformers')}:</td>
                                <td>{info.transformers}</td>
                            </tr>
                            <tr>
                                <td>{t('info.heads')}:</td>
                                <td>{info.heads}</td>
                            </tr>
                            <tr>
                                <td>{t('info.embedding')}:</td>
                                <td>{info.embedding}</td>
                            </tr>
                            <tr>
                                <td>{t('info.context')}:</td>
                                <td>{info.context}</td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
