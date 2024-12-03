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
          <ToolbarConfigProvider>
            <TabManager/>
          </ToolbarConfigProvider>
        </EditorSelectionHandler>
      </main>
      <footer className={styles.footer}>
      </footer>
    </div>
  );
}
