interface ThemeColors {
    primary: string;
    secondary: string;
    disabled: string;
    success: string;
    error: string;
    info: string;
    chartColours: string[];
    highlightColours: string[];
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
        highlightColours: ['#FBC6C6', '#C6FBCC', '#C6C8FB', '#FBC6FB', '#C6FBF2', '#F2C6FB', '#FBEDC6'],
        chartColours: ['#e04f66', '#fd9d32', '#fad630', '#a77bca', '#2e6df5', '#19b1a8', '#c2a251', '#97999b'],
    },
    dark: {
        primary: '#009FB8',
        secondary: '#E996E9',
        disabled: '#616161',
        success: '#81c784',
        error: '#e57373',
        info: '#75a4e2',
        highlightColours: ['#FBC6C6', '#C6FBCC', '#C6C8FB', '#FBC6FB', '#C6FBF2', '#F2C6FB', '#FBEDC6'],
        chartColours: ['#e04f66', '#fd9d32', '#fad630', '#a77bca', '#2e6df5', '#19b1a8', '#c2a251', '#97999b'],
    },
};
