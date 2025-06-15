"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toHexFormat = exports.getHex = exports.getAlphaColor = exports.generateColor = exports.customizePrefixCls = void 0;
var _util = require("@rc-component/color-picker/lib/util");
var _color = require("./color");
const customizePrefixCls = 'ant-color-picker';
exports.customizePrefixCls = customizePrefixCls;
const generateColor = color => {
  if (color instanceof _color.ColorFactory) {
    return color;
  }
  return new _color.ColorFactory(color);
};
exports.generateColor = generateColor;
const getAlphaColor = color => (0, _util.getRoundNumber)(color.toHsb().a * 100);
exports.getAlphaColor = getAlphaColor;
const toHexFormat = (value, alpha) => (value === null || value === void 0 ? void 0 : value.replace(/[^\w/]/gi, '').slice(0, alpha ? 8 : 6)) || '';
exports.toHexFormat = toHexFormat;
const getHex = (value, alpha) => value ? toHexFormat(value, alpha) : '';
exports.getHex = getHex;