const tintColorLight = '#53A72F';
const hoverColorLight = '#3D7716'
const selectedLight = '#1A4508';

const tintColorDark = '#135810';
const hoverColorDark = '#3e673c';
const selectedDark = '#498847';

const dividers = '#44444445'
const placeHolders = '#7a7a7a7a'

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    hover: hoverColorLight,
    selected: selectedLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    divider: dividers,
    placeHolder: placeHolders,
  },
  dark: {
    text: '#ffffff',
    background: '#292929',
    tint: tintColorDark,
    hover: hoverColorDark,
    selected: selectedDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    divider: dividers,
    placeHolder: placeHolders,
  },
};
