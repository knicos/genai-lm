import style from './ProgressBox.module.css';
import listingStyle from './DataListing.module.css';
import prettyNumber from '../../utilities/prettyNumber';
import { useTranslation } from 'react-i18next';

interface Props {
    totalSamples: number;
}

export default function ProgressBox({ totalSamples }: Props) {
    const { t } = useTranslation();

    return (
        <div className={style.container}>
            <div className={listingStyle.size}>{prettyNumber(totalSamples)}</div>
            <div className={listingStyle.label}>{t('data.samples')}</div>
        </div>
    );
}
