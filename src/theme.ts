interface ThemeColors {
    primary: string;
    secondary: string;
    disabled: string;
    success: string;
    error: string;
    info: string;
}

interface Theme {
    light: ThemeColors;
    dark: ThemeColors;
}

export const theme: Theme = {
    light: {
        primary: '#008297',
        secondary: 'rgb(174, 37, 174)',
        disabled: '#bdbdbd',
        success: '#4caf50',
        error: '#f44336',
        info: '#75a4e2',
    },
    dark: {
        primary: '#009FB8',
        secondary: '#E996E9',
        disabled: '#616161',
        success: '#81c784',
        error: '#e57373',
        info: '#75a4e2',
    },
};
