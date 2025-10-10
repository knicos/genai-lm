import DescriptionIcon from '@mui/icons-material/Description';
import { useTranslation } from 'react-i18next';
import prettyNumber from '../../utilities/prettyNumber';

interface Props {
    samples: number;
}

export default function TrainingSamples({ samples }: Props) {
    const { t } = useTranslation();

    return (
        <p>
            <DescriptionIcon />
            {t('model.samples', { samples: prettyNumber(samples) })}
        </p>
    );
}
