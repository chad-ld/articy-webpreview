import type { CSSProperties } from 'react';
export interface ComponentToken {
    titleFontSize: number;
    subtitleFontSize: number;
    iconFontSize: number;
    extraMargin: CSSProperties['margin'];
}
declare const _default: (prefixCls: string) => import("../../theme/internal").UseComponentStyleResult;
export default _default;
