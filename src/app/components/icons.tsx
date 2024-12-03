"use client";
import 'material-symbols';

export const Icon = ({ codePoint = null, iconStyle = 'outlined', ...props }: React.HTMLAttributes<HTMLSpanElement> & {
    codePoint?: string | null;
    iconStyle?: 'outlined' | 'rounded' | 'sharp';
}) => (<span className={`material-symbols-${iconStyle}`} {...props}>{codePoint}</span>);

export const createIcon = (codePoint: string) => (props: React.HTMLAttributes<HTMLSpanElement>) =>
    <Icon codePoint={codePoint} {...props} />;

export const Close = createIcon('\ue5cd');
export const Add = createIcon('\ue145');
export const Remove = createIcon('\ue15b');
export const FormatBold = createIcon('\ue238');
export const FormatItalic = createIcon('\ue23f');
export const FormatUnderline = createIcon('\ue249');
export const FormatStrikethrough = createIcon('\ue246');
export const Superscript = createIcon('\uf112');
export const Subscript = createIcon('\uf111');
export const FormatListBulleted = createIcon('\ue241');
export const FormatListNumbered = createIcon('\ue242');
export const Code = createIcon('\ue86f');
export const CodeBlocks = createIcon('\uf84d');
export const FormatQuote = createIcon('\ue244');
export const Undo = createIcon('\ue166');
export const Redo = createIcon('\ue15a');
export const Link = createIcon('\ue157');
export const HorizontalRule = createIcon('\uf108');