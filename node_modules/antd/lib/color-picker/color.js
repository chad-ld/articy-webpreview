"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ColorFactory = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _colorPicker = require("@rc-component/color-picker");
var _util = require("./util");
let ColorFactory = /*#__PURE__*/function () {
  function ColorFactory(color) {
    (0, _classCallCheck2.default)(this, ColorFactory);
    this.metaColor = new _colorPicker.Color(color);
  }
  (0, _createClass2.default)(ColorFactory, [{
    key: "toHsb",
    value: function toHsb() {
      return this.metaColor.toHsb();
    }
  }, {
    key: "toHsbString",
    value: function toHsbString() {
      return this.metaColor.toHsbString();
    }
  }, {
    key: "toHex",
    value: function toHex() {
      return (0, _util.getHex)(this.toHexString(), this.metaColor.getAlpha() < 1);
    }
  }, {
    key: "toHexString",
    value: function toHexString() {
      return this.metaColor.getAlpha() === 1 ? this.metaColor.toHexString() : this.metaColor.toHex8String();
    }
  }, {
    key: "toRgb",
    value: function toRgb() {
      return this.metaColor.toRgb();
    }
  }, {
    key: "toRgbString",
    value: function toRgbString() {
      return this.metaColor.toRgbString();
    }
  }]);
  return ColorFactory;
}();
exports.ColorFactory = ColorFactory;