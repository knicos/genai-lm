import { TextField } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
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

    const doChange = useCallback(
        (v: string) => {
            setStrValue(v);
            if (v === '') {
                setHasError(t('validation.required'));
                return;
            }

            if (!/^[0-9]*$/.test(v)) {
                setHasError(t('validation.invalid_number'));
                return;
            }

            const newValue = integer ? parseInt(v, 10) : parseFloat(v);
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
        },
        [onChange, min, max, integer, t]
    );

    return (
        <TextField
            error={hasError !== null || !!error}
            helperText={hasError || error}
            label={label}
            type="text"
            inputMode="text"
            variant="filled"
            value={strValue}
            onChange={(e) => doChange(e.target.value)}
        />
    );
}
