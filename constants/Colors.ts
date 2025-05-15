export const ColorsTheme = {
  primary: {
    light: "#FF915E",
    main: "#F97A5C",
    dark: "#CC6B4B",
    darker: "#995038",
  },
  secondary: {
    lighter: "#5DD3DC",
    light: "#4DAEB6",
    main: "#3D8A90",
    dark: "#27595D",
  },
  background: {
    main: "#FFFFFF",
    deep: "#F2E8DA",
    dark: "#CCC5B7",
    darker: "#999389",
  },
  text: {
    main: "#483F44",
    bright: "#6E6068",
    light: "#94818C",
    lighter: "#BAA2B0",
  },
  match: {
    lighter: '#E0FFE0',
    main: "#2ecc71",
    darker: "#27ae60",
  },
  similar: {
    lighter: '#FFE0C0',
    main: '#f39c12',
    darker: "#d35400",
  },
  tag: {
    green: "#E0FFE0",
    blue: "#E0F0FF",
    red: "#FFE0E0",
    purple: "#EDE5FF",
  },
  white: "#FFFFFF",
  black: "#101010",
  gray: "#F9F9F9",
  darkGray: "#747d8c",
  vinted: "#007580",
}

export const DarkColorsTheme = {
  primary: {
    light: "#FF915E",
    main: "#F97A5C",
    dark: "#CC6B4B",
    darker: "#995038",
  },
  secondary: {
    lighter: "#5DD3DC",
    light: "#4DAEB6",
    main: "#3D8A90",
    dark: "#27595D",
  },
  background: {
    main: "#121E2E",
    deep: "#18293F",
    dark: "#243B56",
    darker: "#34537A",
  },
  text: {
    main: "#E8E9ED",
    bright: "#FFFFFF",
    light: "#B8BCC8",
    lighter: "#9098AA",
  },
  match: {
    lighter: '#1A3B27',
    main: "#2ecc71",
    darker: "#27ae60",
  },
  similar: {
    lighter: '#3B2A1A',
    main: '#f39c12',
    darker: "#d35400",
  },
  tag: {
    green: "#E0FFE0",
    blue: "#E0F0FF",
    red: "#FFE0E0",
    purple: "#EDE5FF",
  },
  white: "#FFFFFF",
  black: "#101010",
  gray: "#1E293B",
  darkGray: "#747d8c",
  vinted: "#007580",
}

export const getThemeColors = (isDarkMode: boolean) => 
  isDarkMode ? DarkColorsTheme : ColorsTheme;
