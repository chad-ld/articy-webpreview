import { getRoundNumber } from "@rc-component/color-picker/es/util";
import { ColorFactory } from './color';
export const customizePrefixCls = 'ant-color-picker';
export const generateColor = color => {
  if (color instanceof ColorFactory) {
    return color;
  }
  return new ColorFactory(color);
};
export const getAlphaColor = color => getRoundNumber(color.toHsb().a * 100);
export const toHexFormat = (value, alpha) => (value === null || value === void 0 ? void 0 : value.replace(/[^\w/]/gi, '').slice(0, alpha ? 8 : 6)) || '';
export const getHex = (value, alpha) => value ? toHexFormat(value, alpha) : '';