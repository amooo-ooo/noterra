import Image from "next/image";
import styles from "./page.module.css";
import { TabManager } from "./components/tab-manager";
import { ToolbarConfigProvider } from "./components/editor-toolbar";
import { EditorSelectionHandler } from "./components/monaco-editor";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <EditorSelectionHandler>
          <div className={styles.sidebar} />
          <div className={styles.editor}>
            <ToolbarConfigProvider>
              <TabManager />
            </ToolbarConfigProvider>
          </div>
          <div className={styles.sidebar} />
        </EditorSelectionHandler>
      </main>
      <footer className={styles.footer}>
      </footer>
    </div>
  );
}
