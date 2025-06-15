import type { CSSProperties } from 'react';
/** Component only token. Which will handle additional calculation of alias token */
export interface ComponentToken {
    zIndexPopup: number;
    contentBg: string;
    contentPadding: CSSProperties['padding'];
}
declare const _default: (prefixCls: string) => import("../../theme/internal").UseComponentStyleResult;
export default _default;
