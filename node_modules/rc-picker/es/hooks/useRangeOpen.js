import _slicedToArray from "@babel/runtime/helpers/esm/slicedToArray";
import { useMergedState } from 'rc-util';
import useEvent from "rc-util/es/hooks/useEvent";
import raf from "rc-util/es/raf";
import * as React from 'react';

/**
 * 1. Click input to show picker
 * 2. Calculate next open index
 *
 * If click `confirm`:
 * 3. Hide current picker
 * 4. Open next index picker if exist
 *
 * If not `changeOnBlur` and click outside:
 * 3. Hide picker
 *
 * If `changeOnBlur` and click outside:
 * 3. Hide current picker
 * 4. Open next index picker if exist
 */

/**
 * Auto control of open state
 */
export default function useRangeOpen(defaultOpen, open, activePickerIndex, changeOnBlur, startInputRef, endInputRef, startSelectedValue, endSelectedValue, onOpenChange) {
  var _React$useState = React.useState(false),
    _React$useState2 = _slicedToArray(_React$useState, 2),
    firstTimeOpen = _React$useState2[0],
    setFirstTimeOpen = _React$useState2[1];
  var _useMergedState = useMergedState(defaultOpen || false, {
      value: open,
      onChange: function onChange(nextOpen) {
        onOpenChange === null || onOpenChange === void 0 ? void 0 : onOpenChange(nextOpen);
      }
    }),
    _useMergedState2 = _slicedToArray(_useMergedState, 2),
    mergedOpen = _useMergedState2[0],
    setMergedOpen = _useMergedState2[1];
  var _useMergedState3 = useMergedState(0, {
      value: activePickerIndex
    }),
    _useMergedState4 = _slicedToArray(_useMergedState3, 2),
    mergedActivePickerIndex = _useMergedState4[0],
    setMergedActivePickerIndex = _useMergedState4[1];
  var _React$useState3 = React.useState(null),
    _React$useState4 = _slicedToArray(_React$useState3, 2),
    nextActiveIndex = _React$useState4[0],
    setNextActiveIndex = _React$useState4[1];
  React.useEffect(function () {
    if (mergedOpen) {
      setFirstTimeOpen(true);
    }
  }, [mergedOpen]);
  var triggerOpen = useEvent(function (nextOpen, index, source) {
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
        raf(function () {
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