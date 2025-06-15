import type { FullToken } from '../../theme/internal';
export interface ComponentToken {
    zIndexPopup: number;
    footerPaddingBlock: number;
    footerPaddingInline: number;
}
export interface DrawerToken extends FullToken<'Drawer'> {
}
declare const _default: (prefixCls: string) => import("../../theme/internal").UseComponentStyleResult;
export default _default;
