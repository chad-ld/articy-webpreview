import type { FullToken } from '../../theme/internal';
/** Component only token. Which will handle additional calculation of alias token */
export interface ComponentToken {
    zIndexPopup: number;
    width: number;
}
export interface NotificationToken extends FullToken<'Notification'> {
    animationMaxHeight: number;
    notificationBg: string;
    notificationPadding: string;
    notificationPaddingVertical: number;
    notificationPaddingHorizontal: number;
    notificationIconSize: number;
    notificationCloseButtonSize: number;
    notificationMarginBottom: number;
    notificationMarginEdge: number;
}
declare const _default: (prefixCls: string) => import("../../theme/internal").UseComponentStyleResult;
export default _default;
