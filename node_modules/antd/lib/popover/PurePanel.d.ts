import * as React from 'react';
import type { PopoverProps } from '.';
export declare const getOverlay: (prefixCls: string, title?: PopoverProps['title'], content?: PopoverProps['content']) => React.JSX.Element | undefined;
export interface PurePanelProps extends Omit<PopoverProps, 'children'> {
    children?: React.ReactNode;
}
export declare function RawPurePanel(props: any): React.JSX.Element;
export default function PurePanel(props: any): React.ReactElement<any, string | React.JSXElementConstructor<any>>;
