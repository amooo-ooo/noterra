"use client";

import React from "react";
import { ReactSortable } from "react-sortablejs";
import { TabsContext } from "./tab-manager";
import styles from "@/app/styles/tab-strip.module.scss";
import {
	Upload,
	Plus,
	X,
	LockIcon,
	EditIcon,
	LockOpenIcon,
	XIcon,
} from "lucide-react";
import { handleFile } from "./file-parser";
import { ContextMenuArea } from "./context-menu-area";
import { LocalFile, TabData } from "./editor-files";

export function TabStrip({
	idGen,
	className = "",
	atStripEnd,
}: {
	idGen: () => TabData["id"];
	className?: string;
	atStripEnd?: React.ReactNode;
}) {
	const { tabs, modifyTabs, currentTab, setCurrentTab } =
		React.useContext(TabsContext);

	const close = (tab: TabData) => {
		if (tab.id === currentTab) {
			let idx = tabs.findIndex((x) => x.id === tab.id) - 1;
			if (idx < 0) idx += 2;
			setCurrentTab(tabs[idx]?.id);
		}
		tab.file.save();
		modifyTabs({
			type: "remove",
			predicate: (x) => x.id === tab.id,
		});
	};
	const [renamingTab, setRenamingTab] = React.useState<TabData["id"]>();

	const createFile = (name = "Untitled", content = "hello") => {
		// TODO: get a better id
		const id = idGen();
		const newFile = new LocalFile(id, name, content);
		newFile.save();
		modifyTabs({
			type: "append",
			initialValue: new TabData(newFile),
		});
		setCurrentTab(id);
	};

	return (
		<div className={`${styles.tabstrip} ${className}`}>
			<ReactSortable
				list={tabs}
				setList={(list) => modifyTabs({ type: "reorder", value: list })}
				animation={250}
				style={{ display: "contents" }}
			>
				{...tabs.map((tab, index) => (
					<ContextMenuArea
						key={tab.id}
						menu={[
							{
								name: "rename",
								label: (
									<>
										<EditIcon size="1em" />
										Rename
									</>
								),
								action: () => setRenamingTab(tab.id),
							},
							{
								name: tab.locked ? "unlock-editor" : "lock-editor",
								label: tab.locked ? (
									<>
										<LockOpenIcon size="1em" />
										Unlock Editor
									</>
								) : (
									<>
										<LockIcon size="1em" />
										Lock Editor
									</>
								),
								action: () =>
									modifyTabs({
										type: "mutate",
										index,
										modify: (tab) => tab.withToggleLock(),
									}),
							},
							{
								name: "Close",
								label: (
									<>
										<XIcon size="1em" />
										Close
									</>
								),
								action: () => close(tab),
							},
						]}
						wrapperNode={
							<div
								role="button"
								tabIndex={0}
								title={tab.file.name}
								className={`inherit-button-scaling ${styles.tab} \
									${tab.id === currentTab ? styles["active-tab"] : ""} \
									${tab.locked ? styles["locked-tab"] : ""}`}
								onClick={(e) => {
									// to stop weird clickthrough behavior
									if ((e.target as HTMLElement).closest?.("[popover]")) return;
									e.stopPropagation();
									if (currentTab === tab.id && !tab.locked) {
										setRenamingTab(tab.id);
									} else {
										setCurrentTab(tab.id);
									}
								}}
								onKeyDown={(e) => {
									if (e.key === " ") e.preventDefault();
								}}
								onKeyUp={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.stopPropagation();
										e.currentTarget.click();
									}
								}}
								onPointerUp={(e) => {
									if (tab.id === currentTab) return;
									// to stop weird clickthrough behavior
									if ((e.target as HTMLElement).closest?.("[popover]")) return;
									tab.editor?.commands.focus();
								}}
							/>
						}
					>
						<div className={styles["tab-border"]}>
							{tab.id === renamingTab ? (
								<input
									enterKeyHint="done"
									className={styles["tab-rename-field"]}
									defaultValue={tab.file.name}
									onBlur={() => setRenamingTab(undefined)}
									onKeyUp={(e) => {
										if (e.key !== "Enter") return;
										const newName = e.currentTarget.value;
										modifyTabs({
											type: "mutate",
											index,
											modify: (tab) => {
												tab.file.name = newName;
												return tab;
											},
										});
										setRenamingTab(undefined);
									}}
									ref={(el) => el?.select()}
								/>
							) : (
								<span className={styles.name}>{tab.file.name}</span>
							)}
							{tab.locked ? (
								<LockIcon size="1em" color="var(--fg-disabled)" />
							) : undefined}
							<button
								type="button"
								className={styles["close-icon"]}
								onClick={(e) => {
									e.stopPropagation();
									close(tab);
								}}
								style={{ font: "inherit" }}
							>
								<X size="1.5em" />
							</button>
						</div>
					</ContextMenuArea>
				))}
			</ReactSortable>
			<div className={styles.expanse}>
				<div className={styles["tab-border"]}>
					<button
						type="button"
						onClick={() => {
							createFile();
						}}
						className={styles["add-tab"]}
					>
						<Plus size="1.5em" />
					</button>
					<input
						id="fileUpload"
						name="fileUpload"
						type="file"
						style={{ display: "none" }}
						onChange={async (e) => {
							const file = e.currentTarget.files?.[0];
							e.currentTarget.value = "";
							if (!file) return;
							const id = idGen();
							const newFile = await handleFile(id, file);
							newFile.save();
							modifyTabs({
								type: "append",
								initialValue: new TabData(newFile),
							});
							setCurrentTab(id);
						}}
					/>
					<label
						htmlFor="fileUpload"
						className={`${styles["upload-file"]} inherit-button-scaling`}
					>
						<Upload size="1.5em" />
					</label>
					<div className={styles.expander} />
					{atStripEnd}
				</div>
			</div>
		</div>
	);
}
