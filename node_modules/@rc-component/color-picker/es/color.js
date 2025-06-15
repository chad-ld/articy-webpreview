import _objectSpread from "@babel/runtime/helpers/esm/objectSpread2";
import _objectWithoutProperties from "@babel/runtime/helpers/esm/objectWithoutProperties";
import _typeof from "@babel/runtime/helpers/esm/typeof";
import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import _createSuper from "@babel/runtime/helpers/esm/createSuper";
var _excluded = ["v"];
import { TinyColor } from '@ctrl/tinycolor';
import { convertHsb2Hsv, getRoundNumber } from "./util";
export var Color = /*#__PURE__*/function (_TinyColor) {
  _inherits(Color, _TinyColor);
  var _super = _createSuper(Color);
  function Color(color) {
    _classCallCheck(this, Color);
    return _super.call(this, convertHsb2Hsv(color));
  }
  _createClass(Color, [{
    key: "toHsbString",
    value: function toHsbString() {
      var hsb = this.toHsb();
      var saturation = getRoundNumber(hsb.s * 100);
      var lightness = getRoundNumber(hsb.b * 100);
      var hue = getRoundNumber(hsb.h);
      var alpha = hsb.a;
      var hsbString = "hsb(".concat(hue, ", ").concat(saturation, "%, ").concat(lightness, "%)");
      var hsbaString = "hsba(".concat(hue, ", ").concat(saturation, "%, ").concat(lightness, "%, ").concat(alpha.toFixed(alpha === 0 ? 0 : 2), ")");
      return alpha === 1 ? hsbString : hsbaString;
    }
  }, {
    key: "toHsb",
    value: function toHsb() {
      var hsv = this.toHsv();
      if (_typeof(this.originalInput) === 'object' && this.originalInput) {
        if ('h' in this.originalInput) {
          hsv = this.originalInput;
        }
      }
      var _hsv = hsv,
        v = _hsv.v,
        resets = _objectWithoutProperties(_hsv, _excluded);
      return _objectSpread(_objectSpread({}, resets), {}, {
        b: hsv.v
      });
    }
  }]);
  return Color;
}(TinyColor);