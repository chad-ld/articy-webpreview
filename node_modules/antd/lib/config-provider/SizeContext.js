"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.SizeContextProvider = void 0;
var React = _interopRequireWildcard(require("react"));
var _useSize = _interopRequireDefault(require("./hooks/useSize"));
const SizeContext = /*#__PURE__*/React.createContext(undefined);
const SizeContextProvider = _ref => {
  let {
    children,
    size
  } = _ref;
  const mergedSize = (0, _useSize.default)(size);
  return /*#__PURE__*/React.createElement(SizeContext.Provider, {
    value: mergedSize
  }, children);
};
exports.SizeContextProvider = SizeContextProvider;
var _default = SizeContext;
exports.default = _default;