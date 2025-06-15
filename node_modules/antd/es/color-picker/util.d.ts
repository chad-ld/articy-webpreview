import type { ColorGenInput } from '@rc-component/color-picker';
import type { Color } from './color';
export declare const customizePrefixCls = "ant-color-picker";
export declare const generateColor: (color: ColorGenInput<Color>) => Color;
export declare const getAlphaColor: (color: Color) => number;
export declare const toHexFormat: (value?: string, alpha?: boolean) => string;
export declare const getHex: (value?: string, alpha?: boolean) => string;
