import styles from "./page.module.css";
import { TabManager } from "./components/tab-manager";
import { ToolbarConfigProvider } from "./components/editor-toolbar";
import { EditorSelectionHandler } from "./components/monaco-editor";
import {
	ActiveElementProvider,
	ThemeProvider,
	WindowSizeProvider,
} from "./components/global-listeners";

export default function Home() {
	return (
		<ThemeProvider>
			<WindowSizeProvider>
				<ActiveElementProvider>
					<div className={styles.page}>
						<main className={styles.main}>
							<EditorSelectionHandler>
								<ToolbarConfigProvider>
									<TabManager
										tabstripClass={styles.tabstrip}
										contentRowClass={styles["content-row"]}
										editorContainerClass={styles["editor-container"]}
										toolbarClass={styles.toolbar}
										editorClass={styles.editor}
										contentRowContent={
											<>
												<div className={styles.sidebar} />
												<div className={`${styles.sidebar} ${styles.right}`} />
											</>
										}
									/>
								</ToolbarConfigProvider>
							</EditorSelectionHandler>
						</main>
						<footer className={styles.footer} />
					</div>
				</ActiveElementProvider>
			</WindowSizeProvider>
		</ThemeProvider>
	);
}
