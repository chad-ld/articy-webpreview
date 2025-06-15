import LoadingOutlined from "@ant-design/icons/es/icons/LoadingOutlined";
import CSSMotion from 'rc-motion';
import React, { forwardRef } from 'react';
import classNames from 'classnames';
import IconWrapper from './IconWrapper';
const InnerLoadingIcon = /*#__PURE__*/forwardRef((_ref, ref) => {
  let {
    prefixCls,
    className,
    style,
    iconClassName
  } = _ref;
  const mergedIconCls = classNames(`${prefixCls}-loading-icon`, className);
  return /*#__PURE__*/React.createElement(IconWrapper, {
    prefixCls: prefixCls,
    className: mergedIconCls,
    style: style,
    ref: ref
  }, /*#__PURE__*/React.createElement(LoadingOutlined, {
    className: iconClassName
  }));
});
const getCollapsedWidth = () => ({
  width: 0,
  opacity: 0,
  transform: 'scale(0)'
});
const getRealWidth = node => ({
  width: node.scrollWidth,
  opacity: 1,
  transform: 'scale(1)'
});
const LoadingIcon = _ref2 => {
  let {
    prefixCls,
    loading,
    existIcon,
    className,
    style
  } = _ref2;
  const visible = !!loading;
  if (existIcon) {
    return /*#__PURE__*/React.createElement(InnerLoadingIcon, {
      prefixCls: prefixCls,
      className: className,
      style: style
    });
  }
  return /*#__PURE__*/React.createElement(CSSMotion, {
    visible: visible,
    // We do not really use this motionName
    motionName: `${prefixCls}-loading-icon-motion`,
    removeOnLeave: true,
    onAppearStart: getCollapsedWidth,
    onAppearActive: getRealWidth,
    onEnterStart: getCollapsedWidth,
    onEnterActive: getRealWidth,
    onLeaveStart: getRealWidth,
    onLeaveActive: getCollapsedWidth
  }, (_ref3, ref) => {
    let {
      className: motionCls,
      style: motionStyle
    } = _ref3;
    return /*#__PURE__*/React.createElement(InnerLoadingIcon, {
      prefixCls: prefixCls,
      className: className,
      style: Object.assign(Object.assign({}, style), motionStyle),
      ref: ref,
      iconClassName: motionCls
    });
  });
};
export default LoadingIcon;