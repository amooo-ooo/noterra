"use client";

import React from "react";
import { ReactSortable } from "react-sortablejs";
import type { Tab, TabListDispatcher } from "./tab-manager";
import styles from "@/app/styles/tab-strip.module.scss";
import { Upload, Plus, X, LockIcon } from "lucide-react";
import { handleFile } from "./file-parser";
import { ContextMenuArea } from "./context-menu-area";

export function TabStrip({
	tabs,
	modifyTabs,
	currentTab,
	setCurrentTab,
	idGen,
	className = "",
	atStripEnd,
}: {
	tabs: Tab[];
	modifyTabs: TabListDispatcher;
	currentTab: Tab["id"] | undefined;
	setCurrentTab: React.Dispatch<Tab["id"] | undefined>;
	idGen: () => Tab["id"];
	className?: string;
	atStripEnd?: React.ReactNode;
}) {
	const close = (tab: Tab) => {
		if (tab.id === currentTab) {
			let idx = tabs.findIndex((x) => x.id === tab.id) - 1;
			if (idx < 0) idx += 2;
			setCurrentTab(tabs[idx]?.id);
		}
		modifyTabs({
			type: "remove",
			predicate: (x) => x.id === tab.id,
		});
	};
	const [renamingTab, setRenamingTab] = React.useState<Tab["id"]>();

	const createFile = (name = "Untitled", content = "hello") => {
		const id = idGen();
		modifyTabs({
			type: "append",
			initialValue: {
				id,
				state: {
					id: `${id}`, // TODO: get a better id
					name,
					initialContent: content,
				},
			},
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
								name: tab.state.locked ? "Unlock Editor" : "Lock Editor",
								action: () =>
									modifyTabs({
										type: "mutate",
										index,
										modify: (tab) => ({
											...tab,
											state: {
												...tab.state,
												locked: !tab.state.locked,
											},
										}),
									}),
							},
							{ name: "Close", action: () => close(tab) },
						]}
						wrapperNode={
							<div
								role="button"
								tabIndex={0}
								title={tab.state.name}
								className={`inherit-button-scaling ${styles.tab} \
									${tab.id === currentTab ? styles["active-tab"] : ""} \
									${tab.state.locked ? styles["locked-tab"] : ""}`}
								onClick={(e) => {
									// to stop weird clickthrough behavior
									if ((e.target as HTMLElement).closest?.("[popover]")) return;
									e.stopPropagation();
									if (currentTab === tab.id && !tab.state.locked) {
										setRenamingTab(tab.id);
									} else setCurrentTab(tab.id);
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
									tab.state.editor?.commands.focus();
								}}
							/>
						}
					>
						<div className={styles["tab-border"]}>
							{tab.id === renamingTab ? (
								<input
									className={styles["tab-rename-field"]}
									defaultValue={tab.state.name}
									onBlur={() => setRenamingTab(undefined)}
									onKeyUp={(e) => {
										if (e.key !== "Enter") return;
										const newName = e.currentTarget.value;
										modifyTabs({
											type: "mutate",
											index,
											modify: (tab) => {
												tab.state.name = newName;
												return tab;
											},
										});
										setRenamingTab(undefined);
									}}
									ref={(el) => el?.select()}
								/>
							) : (
								<span className={styles.name}>{tab.state.name}</span>
							)}
							{tab.state.locked ? (
								<LockIcon size="1.2em" color="var(--fg-disabled)" />
							) : undefined}
							<button
								type="button"
								className={styles["close-icon"]}
								onClick={(e) => {
									e.stopPropagation();
									close(tab);
								}}
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
							// const reader = new FileReader();
							// const contents = await new Promise<string>((res) => {
							// 	reader.onload = () => res(reader.result as string);
							// 	reader.readAsText(file);
							// });
							// TODO: parse contents, passed `contents` should be HTML
							createFile(file.name, await handleFile(file));
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
