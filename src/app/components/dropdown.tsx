import { EditorContext } from "./editor";
import { ChainedCommands, Editor } from "@tiptap/core";


type DropdownOptions = {
	
}
// im not liking the way these props are looking to look
// yeah :/
// surely a seperate comp to act as an option as a child like <Option> or smth
// yeah that's true

export function TiptapDropdown({ options }) :{
	option: DropdownOptions
} {
	const editor = React.useContext(EditorContext).editor;
	const [isOpen, setIsOpen] = React.useState(false);
	const dropdownRef = React.useRef(null);

	const activeItem = editor.isActive(item.isActiveKey, item.params);

	const handleChange = (label) => { // holy frick this needs rewrite
		// yeah lol
		const action = items.contents.find((item) => item.label === label);
		if (action) editor.chain().focus()[action.action](action.action_param).run();
		setIsOpen(false);
	};

	React.useEffect(() => {
		const handleClickOutside = (e) =>
			!dropdownRef.current?.contains(e.target) && setIsOpen(false); 
		// im just gonna rewrite it
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);
	// it might be worth  considering using portals  for the dropdowne'd content
	// portals?
	// allow you  to place content thats logistically "here" in the react DOM
	// but  can be rendered at other places in the native DOM e.g. directly inside <body>
	
	// rightt,might need to learn that :/
	// right i getcha
	return (
		<div className="toolbar-dropdown" ref={dropdownRef}>
			<button className="dropdown-button" onClick={() => setIsOpen((prev) => !prev)}>
				<p>{activeItem?.label ?? items.default}</p>
				<span className="material-symbols-outlined">
					{isOpen ? "arrow_drop_up" : "arrow_drop_down"}
				</span> 
			</button>
			{/* is it possible to use a <select> with the options in place of a button */}
			{/* and then also provide the custom ui and somehow cancelling the native ui from opening? */}
			{/* this would likely be better for a11y */}
			{/* alternatively i would reccomend using radio inputs with labels in the dropdown list */}
			{/* as this would have a similar interface for a11y users */}
			{isOpen && (
				<div className="dropdown-list">
					{items.contents.map(({ label }) => (
						<div
							key={label}
							className="dropdown-item"
							onClick={() => handleChange(label)}
							style={items.style === "font" ? { fontFamily: label } : null}
						>
							<p>{label}</p>
							{/* dont use ps for not  p things */}
						</div>
					))}
					{/* chores time brb kk */}
					{/* TODO: <datalist>'d input (for font size mainly) */}
				</div>
			)}
		</div>
	);
};

