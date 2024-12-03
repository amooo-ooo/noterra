

interface DocumentManagerState {
	name: string;
}

const DocumentManager = React.createContext<DocumentManagerState>(null as unknown as DocumentManagerState);

type TabState = {
	id: number,
	document: DocumentManagerState
}

const TabManager = React.createContext<TabState[]>([]);

export function App() {
	return <TabManager.Provider value={[]}>

	</TabManager.Provider>
}

export const SearchIcon = props => (<span class="material-symbols-outlined">&#xE8B6;</span>)

export function Comp<T extends {toString(): string}>(props: {value: T}) {
	return <div>{props.value.toString()}</div>
}

// export function X() {
// 	return <{Comp<string>}>
// }

import 'material-symbols';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
    name: string;
    iconStyle?: 'outlined' | 'rounded' | 'sharp';
}

export const Icon = ({ name, iconStyle = 'outlined', ...props }: React.HTMLAttributes<HTMLSpanElement> & {
    name: string;
    iconStyle?: 'outlined' | 'rounded' | 'sharp';
}) => (<span className={`material-symbols-${iconStyle}`} {...props}>{name}</span>);
