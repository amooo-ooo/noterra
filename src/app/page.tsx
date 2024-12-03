import styles from "./page.module.css";
import { TabManager } from "./components/tab-manager";
import { ToolbarConfigProvider } from "./components/editor-toolbar";
import { EditorSelectionHandler } from "./components/monaco-editor";

export default function Home() {
	return (
		<div className={styles.page}>
			<main className={styles.main}>
				<div className={styles.sidebar} />
				<div className={styles.editor}>
					<EditorSelectionHandler>
						<ToolbarConfigProvider>
							<TabManager />
						</ToolbarConfigProvider>
					</EditorSelectionHandler>
				</div>
				<div className={styles.sidebar} />
			</main>
			<footer className={styles.footer} />
		</div>
	);
}
