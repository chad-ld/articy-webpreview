"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _typeof = require("@babel/runtime/helpers/typeof");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useRangeOpen;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _rcUtil = require("rc-util");
var _useEvent = _interopRequireDefault(require("rc-util/lib/hooks/useEvent"));
var _raf = _interopRequireDefault(require("rc-util/lib/raf"));
var React = _interopRequireWildcard(require("react"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
/**
 * Auto control of open state
 */
function useRangeOpen(defaultOpen, open, activePickerIndex, changeOnBlur, startInputRef, endInputRef, startSelectedValue, endSelectedValue, onOpenChange) {
  var _React$useState = React.useState(false),
    _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
    firstTimeOpen = _React$useState2[0],
    setFirstTimeOpen = _React$useState2[1];
  var _useMergedState = (0, _rcUtil.useMergedState)(defaultOpen || false, {
      value: open,
      onChange: function onChange(nextOpen) {
        onOpenChange === null || onOpenChange === void 0 ? void 0 : onOpenChange(nextOpen);
      }
    }),
    _useMergedState2 = (0, _slicedToArray2.default)(_useMergedState, 2),
    mergedOpen = _useMergedState2[0],
    setMergedOpen = _useMergedState2[1];
  var _useMergedState3 = (0, _rcUtil.useMergedState)(0, {
      value: activePickerIndex
    }),
    _useMergedState4 = (0, _slicedToArray2.default)(_useMergedState3, 2),
    mergedActivePickerIndex = _useMergedState4[0],
    setMergedActivePickerIndex = _useMergedState4[1];
  var _React$useState3 = React.useState(null),
    _React$useState4 = (0, _slicedToArray2.default)(_React$useState3, 2),
    nextActiveIndex = _React$useState4[0],
    setNextActiveIndex = _React$useState4[1];
  React.useEffect(function () {
    if (mergedOpen) {
      setFirstTimeOpen(true);
    }
  }, [mergedOpen]);
  var triggerOpen = (0, _useEvent.default)(function (nextOpen, index, source) {
    if (index === false) {
      // Only when `nextOpen` is false and no need open to next index
      setMergedOpen(nextOpen);
    } else if (nextOpen) {
      setMergedActivePickerIndex(index);
      setMergedOpen(nextOpen);
      var nextIndex = index === 0 ? 1 : 0;

      // Record next open index
      if (!mergedOpen ||
      // Also set next index if next is empty
      ![startSelectedValue, endSelectedValue][nextIndex]) {
        setNextActiveIndex(nextIndex);
      } else {
        setFirstTimeOpen(false);
        if (nextActiveIndex !== null) {
          setNextActiveIndex(null);
        }
      }
    } else if (source === 'confirm' || source === 'blur' && changeOnBlur) {
      if (nextActiveIndex !== null) {
        setFirstTimeOpen(false);
        setMergedActivePickerIndex(nextActiveIndex);
      }
      setNextActiveIndex(null);

      // Focus back
      if (nextActiveIndex !== null) {
        (0, _raf.default)(function () {
          var _ref$current;
          var ref = [startInputRef, endInputRef][nextActiveIndex];
          (_ref$current = ref.current) === null || _ref$current === void 0 ? void 0 : _ref$current.focus();
        });
      } else {
        setMergedOpen(false);
      }
    } else {
      setMergedOpen(false);
    }
  });
  return [mergedOpen, mergedActivePickerIndex, firstTimeOpen, triggerOpen];
}