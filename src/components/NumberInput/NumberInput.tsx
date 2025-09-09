import { TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    integer?: boolean;
    label: string;
    error?: string;
}

export default function NumberInput({ value, onChange, min, max, integer, label, error }: Props) {
    const { t } = useTranslation();
    const [strValue, setStrValue] = useState<string>(value.toString());
    const [hasError, setHasError] = useState<string | null>(null);

    useEffect(() => {
        setStrValue(value.toString());
    }, [value]);

    useEffect(() => {
        if (strValue === '') {
            setHasError(t('validation.required'));
            return;
        }

        if (!/^[0-9]*$/.test(strValue)) {
            setHasError(t('validation.invalid_number'));
            return;
        }

        const newValue = integer ? parseInt(strValue, 10) : parseFloat(strValue);
        if (isNaN(newValue)) {
            setHasError(t('validation.invalid_number'));
            return;
        }

        if (newValue < min || newValue > max) {
            setHasError(t('validation.out_of_range', { min, max }));
            return;
        }

        setHasError(null);
        onChange(newValue);
    }, [strValue, onChange, min, max, integer, t]);

    return (
        <TextField
            error={hasError !== null || !!error}
            helperText={hasError || error}
            label={label}
            type="text"
            inputMode="text"
            variant="filled"
            value={strValue}
            onChange={(e) => setStrValue(e.target.value)}
        />
    );
}
