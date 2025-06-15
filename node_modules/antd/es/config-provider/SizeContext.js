import * as React from 'react';
import useSize from './hooks/useSize';
const SizeContext = /*#__PURE__*/React.createContext(undefined);
export const SizeContextProvider = _ref => {
  let {
    children,
    size
  } = _ref;
  const mergedSize = useSize(size);
  return /*#__PURE__*/React.createElement(SizeContext.Provider, {
    value: mergedSize
  }, children);
};
export default SizeContext;