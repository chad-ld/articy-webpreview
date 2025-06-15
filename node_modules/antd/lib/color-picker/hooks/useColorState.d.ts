import type { Color } from '../color';
declare const useColorState: (defaultStateValue: Color | string, option: {
    defaultValue?: Color | string;
    value?: Color | string;
}) => readonly [Color, React.Dispatch<React.SetStateAction<Color>>];
export default useColorState;
