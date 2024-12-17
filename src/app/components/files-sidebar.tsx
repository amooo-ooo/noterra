import React from "react";
import { File, LocalFile, TabData } from "./editor-files";
import { SquareArrowOutUpRight, Trash2Icon, X } from "lucide-react";
import { unreachable } from "./util";
import { TabsContext } from "./tab-manager";

import styles from "@/app/styles/files-sidebar.module.scss";

type FileStoreAction =
	| { type: "update"; value: File }
	| { type: "remove"; value: File["id"] };

function fileStore(
	state: Record<File["id"], File | undefined>,
	action: FileStoreAction,
): Record<File["id"], File | undefined> {
	switch (action.type) {
		case "update":
			return {
				...state,
				[action.value.id]: action.value,
			};
		case "remove":
			return {
				...state,
				[action.value]: undefined,
			};
		default:
			unreachable(action);
	}
}

export function FilesSidebar({
	onClose,
}: {
	onClose?(): void;
	animationDuration?: number;
}) {
	const [files, updateFile] = React.useReducer(fileStore, {});
	const { tabs, modifyTabs, currentTab, setCurrentTab } =
		React.useContext(TabsContext);

	React.useEffect(() => {
		(async () => {
			for await (const file of LocalFile.files()) {
				updateFile({ type: "update", value: file });
			}
		})();
		const onHandle = File.on("save", (file) =>
			updateFile({ type: "update", value: file }),
		);
		const offHandle = File.on("delete", (file) =>
			updateFile({ type: "remove", value: file.id }),
		);
		return () => {
			onHandle.dispose();
			offHandle.dispose();
		};
	}, []);

	return (
		<div className={`${styles.sidebar}`}>
			<div className={styles.header}>
				<span className={styles.title}>Files</span>
				<button
					type="button"
					onClick={onClose}
					className={styles["close-button"]}
				>
					<X size="1.5em" />
				</button>
			</div>
			{Object.values(files).map(
				(file) =>
					file && (
						<div key={file.id} className={styles.file}>
							<span className={styles["file-name"]} title={file.name}>
								{file.name}
							</span>
							<button
								type="button"
								disabled={currentTab === file.id}
								onClick={() => {
									const tab = tabs.find((tab) => tab.file.id === file.id);
									if (tab) {
										setCurrentTab(tab.id);
									} else {
										modifyTabs({
											type: "append",
											initialValue: new TabData(file),
										});
										setCurrentTab(file.id);
									}
								}}
							>
								<SquareArrowOutUpRight size="1.5em" />
							</button>
							<button
								type="button"
								onClick={async () => {
									await file.delete();
									modifyTabs({
										type: "remove",
										predicate: (tab) => tab.file.id === file.id,
									});
								}}
							>
								<Trash2Icon size="1.5em" />
							</button>
						</div>
					),
			)}
		</div>
	);
}
