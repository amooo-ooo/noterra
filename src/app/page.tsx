import Image from "next/image";
import styles from "./page.module.css";
import { TabManager } from "./components/TabStrip";
import { ToolbarConfigProvider } from "./components/editor-toolbar";
import { EditorSelectionHandler } from "./components/monaco-editor";

// const tdStyle = {
//   borderBottom: '1px solid white',
//   borderInline: '1px solid white',
//   padding: 10,
// } satisfies React.CSSProperties


export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        {/* <TabStrip/> */}
        {/* <table style={{
          borderCollapse: 'collapse'
        }}>
          <tbody>
            <tr>
              <td style={tdStyle}>a</td>
              <td style={{...tdStyle, borderBottomRightRadius: 5}}>a</td>
              <td style={{
                ...tdStyle,
                borderBottom: 'none',
                borderTop: '1px solid white',
                borderTopLeftRadius: 5,
                borderTopRightRadius: 5,
              }}>a</td>
              <td style={{...tdStyle, borderBottomLeftRadius: 5}}>a</td>
              <td style={tdStyle}>a</td>
            </tr>
          </tbody>
        </table> */}
        <EditorSelectionHandler>
          <ToolbarConfigProvider>
            <TabManager/>
          </ToolbarConfigProvider>
        </EditorSelectionHandler>
        <ol>
          <li>
            Get started by editing <code>src/app/page.tsx</code>.
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        {/* <Table/> */}
        {/* <EditorSelectionHandler>
          <div contentEditable suppressContentEditableWarning>
            hello hello text here
            <MonacoEditor/>
            more text here yayy
          </div>
        </EditorSelectionHandler> */}


        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className={styles.logo}
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondary}
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className={styles.footer}>
        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
