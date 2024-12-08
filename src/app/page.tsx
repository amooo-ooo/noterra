import styles from "./page.module.css";
import { TabManager } from "./components/tab-manager";
import { ToolbarConfigProvider } from "./components/editor-toolbar";
import { EditorSelectionHandler } from "./components/monaco-editor";
import { WindowSizeProvider } from "./components/global-listeners";

export default function Home() {
	return (
		<WindowSizeProvider>
			<div className={styles.page}>
				<main className={styles.main}>
					<div className={styles.sidebar} />
					<div className={styles["editor-container"]}>
						<EditorSelectionHandler>
							<ToolbarConfigProvider>
								<TabManager
									tabstripClass={styles.tabstrip}
									toolbarClass={styles.toolbar}
									editorClass={styles.editor}
								/>
							</ToolbarConfigProvider>
						</EditorSelectionHandler>
					</div>
					<div className={styles.sidebar} />
				</main>
				<footer className={styles.footer} />
			</div>
		</WindowSizeProvider>
	);
}
