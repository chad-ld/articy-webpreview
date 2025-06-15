import type { AliasToken, FullToken, GenerateStyle } from '../../theme/internal';
import type { TokenWithCommonCls } from '../../theme/util/genComponentStyleHook';
/** Component only token. Which will handle additional calculation of alias token */
export interface ComponentToken {
    headerBg: string;
    titleLineHeight: number;
    titleFontSize: number;
    titleColor: string;
    contentBg: string;
    footerBg: string;
}
export interface ModalToken extends FullToken<'Modal'> {
    modalHeaderHeight: number;
    modalBodyPadding: number;
    modalHeaderPadding: string;
    modalHeaderBorderWidth: number;
    modalHeaderBorderStyle: string;
    modalHeaderBorderColorSplit: string;
    modalFooterBorderColorSplit: string;
    modalFooterBorderStyle: string;
    modalFooterPaddingVertical: number;
    modalFooterPaddingHorizontal: number;
    modalFooterBorderWidth: number;
    modalIconHoverColor: string;
    modalCloseIconColor: string;
    modalCloseBtnSize: number;
    modalConfirmIconSize: number;
}
export declare const genModalMaskStyle: GenerateStyle<TokenWithCommonCls<AliasToken>>;
declare const _default: (prefixCls: string) => import("../../theme/internal").UseComponentStyleResult;
export default _default;
