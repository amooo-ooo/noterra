"use client";
import { Editor, useMonaco } from "@monaco-editor/react";
import type { Transaction } from "@tiptap/pm/state";
import {
	type Editor as TiptapEditor,
	type NodeViewProps,
	NodeViewWrapper,
} from "@tiptap/react";
import "./monaco-node-extension";
import type { editor as MonacoEditorNS } from "monaco-editor";
import React from "react";
import { EditorContext } from "./editor";
import styles from "@/app/styles/monaco-editor.module.scss";
import { Option, Select } from "./select";

type RangeListener = [Node, (selection: Selection) => void];
const SelectionHandler = React.createContext<RangeListener[]>([]);
export function EditorSelectionHandler(props: React.PropsWithChildren<object>) {
	const listeners = React.useRef<RangeListener[]>([]);
	React.useEffect(() => {
		document.addEventListener(
			"selectionchange",
			() => {
				const selection = window.getSelection();
				if (!selection || !selection.isCollapsed) return;
				for (let i = listeners.current.length - 1; i >= 0; i--) {
					const [node, listener] = listeners.current[i];
					if (!document.contains(node)) listeners.current.splice(i, 1);
					if (selection.containsNode(node, true)) listener(selection);
				}
			},
			{ capture: true },
		);
	});
	return (
		<SelectionHandler.Provider value={listeners.current}>
			{props.children}
		</SelectionHandler.Provider>
	);
}

const isReverseKey = (key: string) => {
	return (
		key === "ArrowLeft" ||
		key === "ArrowUp" ||
		key === "PageUp" ||
		key === "Home"
	);
};

export function MonacoEditor({
	editor,
	node,
	// decorations,
	selected,
	extension,
	getPos,
	updateAttributes,
	// deleteNode,
}: NodeViewProps) {
	const [height, setHeight] = React.useState(0);
	const [mcEditor, setMcEditor] =
		React.useState<MonacoEditorNS.IStandaloneCodeEditor>();
	const containerRef = React.useRef<HTMLDivElement | null>(null);

	const tiptapState = React.useContext(EditorContext);
	const selectionHandler = React.useContext(SelectionHandler);
	const content = node.content.content.map((node) => node.textContent).join("");
	const monaco = useMonaco();

	React.useEffect(() => {
		const callback = ({
			editor,
			transaction,
		}: { editor: TiptapEditor; transaction: Transaction }) => {
			if (transaction.selection.empty) return;
			if (transaction.selection.$head.parent === node) {
				editor.commands.setTextSelection({
					from: transaction.selection.anchor,
					to: isReverseKey(tiptapState.lastKeyPress ?? "")
						? getPos() - 1
						: getPos() + node.nodeSize,
				});
			}
		};
		editor.on("selectionUpdate", callback);
		return () => {
			editor.off("selectionUpdate", callback);
		};
	}, [editor, node, getPos, tiptapState]);

	React.useEffect(() => {
		return mcEditor?.onKeyDown((e) => {
			if (!mcEditor.hasTextFocus()) return;
			if (e.code !== "Backspace" && e.code !== "Delete") return;
			const selections = mcEditor.getSelections();
			if (!selections?.length || selections.length > 1) return;
			const selection = selections[0];
			if (!selection.isEmpty()) return;
			const selectPos = selection.getPosition();
			const range = mcEditor.getModel()?.getFullModelRange();
			if (
				range &&
				e.code === "Backspace" &&
				!range.getStartPosition().equals(selectPos)
			)
				return;
			if (
				range &&
				e.code === "Delete" &&
				!range.getEndPosition().equals(selectPos)
			)
				return;
			editor
				.chain()
				.unsetCodeBlock()
				.focus(
					e.code === "Delete" ? getPos() + node.nodeSize - 1 : getPos() + 1,
				)
				.run();
		}).dispose;
	}, [editor, mcEditor, getPos, node]);

	React.useEffect(() => {
		return mcEditor?.onKeyDown((e) => {
			if (!mcEditor.hasTextFocus()) return;
			if (!e.code.startsWith("Arrow")) return;
			const selection = mcEditor.getSelection();
			if (
				!(
					// extra brackets required, functionally different
					selection?.isEmpty()
				)
			)
				return;
			const selectPos = selection.getPosition();

			const range = mcEditor.getModel()?.getFullModelRange();
			if (!range) return;
			if (
				// Should we leave codeblock?
				(e.code === "ArrowUp" &&
					!(selectPos.lineNumber === range.startLineNumber)) ||
				(e.code === "ArrowDown" &&
					!(selectPos.lineNumber === range.endLineNumber)) ||
				(e.code === "ArrowLeft" &&
					!selectPos.equals(range.getStartPosition())) ||
				(e.code === "ArrowRight" && !selectPos.equals(range.getEndPosition()))
			)
				return;

			const pos = editor.$pos(getPos() + 1 /* WHY */);
			if (e.code === "ArrowUp" || e.code === "ArrowLeft") {
				if (
					!pos.before ||
					pos.before.node.type === editor.schema.nodes.monacoCodeBlock
				) {
					editor.commands.insertContentAt(pos.from - 1, "<p></p>");
					editor.commands.focus(pos.from - 1);
				} else editor.commands.focus(pos.from - 2);
			} else {
				if (
					!pos.after ||
					pos.after.node.type === editor.schema.nodes.monacoCodeBlock
				)
					editor.commands.insertContentAt(pos.to, "<p></p>");
				editor.commands.focus(pos.to);
			}
		}).dispose;
	}, [editor, mcEditor, getPos]);

	const currentLanguage = React.useMemo(() => {
		// Map language attr to the nearest available language
		const value = (node.attrs.language as string | null | undefined)
			?.trim()
			.toLowerCase();
		if (!value || value === "(auto)") return "(auto)";
		for (const lang of monaco?.languages.getLanguages() ?? []) {
			const langId = lang.id.toLowerCase();
			if (langId.toLowerCase() === value) return langId.toLowerCase();
			for (const alias of [
				...(lang.aliases ?? []),
				...(lang.extensions ?? []), // TODO: is this relevant/neccesary
			]) {
				if (alias.toLowerCase() === value) return langId.toLowerCase();
			}
		}
		return "(auto)";
	}, [monaco, node.attrs.language]);

	const languageOptions = React.useMemo(
		() => [
			<Option key="(auto)" value="(auto)" />,
			...(monaco?.languages
				.getLanguages()
				.map((lang) => (
					<Option key={lang.id} value={lang.id} valueAliases={lang.aliases} />
				)) ?? []),
		],
		[monaco],
	);
	const languageSelector = React.useMemo(
		() => (
			<Select
				value={currentLanguage}
				onChange={(value) => updateAttributes({ language: value })}
				className={styles["language-selector"]}
				updatePosition={(update) => {
					requestAnimationFrame(update);
					tiptapState.scrollingElement?.addEventListener("scroll", update, {
						passive: true,
					});
					return () =>
						tiptapState.scrollingElement?.removeEventListener("scroll", update);
				}}
			>
				{languageOptions}
			</Select>
		),
		[
			currentLanguage,
			updateAttributes,
			languageOptions,
			tiptapState.scrollingElement,
		],
	);

	return (
		<NodeViewWrapper
			ref={containerRef}
			style={{
				anchorName: "--monaco", // contain overlay positions
			}}
		>
			<div className={styles.container}>
				<div // TODO: can we replace these with more tiptap-integrated detectors?? (probably)
					className={styles["detector-hidden"]}
					ref={(el) => {
						if (!el) return;
						selectionHandler.push([
							el,
							() => {
								if (!mcEditor) return;
								const model = mcEditor.getModel();
								if (!model) return;
								mcEditor.focus();
								if (isReverseKey(tiptapState.lastKeyPress ?? ""))
									mcEditor.setSelection(
										model.getFullModelRange().collapseToEnd(),
									);
								else
									mcEditor.setSelection(
										model.getFullModelRange().collapseToStart(),
									);
							},
						]);
					}}
				>
					```
				</div>
				<div
					contentEditable={false}
					style={{
						userSelect: "none",
					}}
				>
					<style
						// biome-ignore lint/security/noDangerouslySetInnerHtml: intentional
						dangerouslySetInnerHTML={{
							__html: `
								.monaco-editor, .monaco-editor-background {
									background: transparent;
								}

								.monaco-editor .margin {
									background: transparent;
								}

								.overflowingContentWidgets {
									position-anchor: --monaco;
									top: calc(anchor(top) + var(--codeblock-padding-top));
									left: calc(anchor(left) + var(--codeblock-margin) + var(--codeblock-deindent-left));
									overflow: visible;
									border: none;
								}
							`,
						}}
					/>
					<Editor
						height={height + 19}
						{...extension.options}
						value={content}
						language={node.attrs.language ?? undefined}
						options={{
							automaticLayout: true,
							scrollBeyondLastLine: false,
							...extension.options.options,
						}}
						onChange={(value, ev) => {
							editor.commands.insertContentAt(
								{
									// literally magic numbers right here
									from: getPos() + 1,
									to: getPos() + node.nodeSize - 1,
								},
								value ? editor.schema.text(value) : "",
							);
							extension.options.onChange?.(value, ev);
						}}
						onMount={(mcEditor, monaco) => {
							setMcEditor(mcEditor);
							setHeight(mcEditor?.getContentHeight() ?? 0);
							if (!node.attrs.hasUsed) {
								mcEditor.focus();
								updateAttributes({ hasUsed: true });
							}
							const overflow = mcEditor
								.getDomNode()
								?.querySelector(".overflowingContentWidgets") as HTMLElement;
							if (overflow) {
								overflow.popover = "manual";
								overflow.showPopover();
							}

							mcEditor.onDidContentSizeChange((e) => {
								setHeight(e.contentHeight);
							});

							const pos = editor.$pos(getPos() + 1 /* WHY */);
							if ((pos.parent?.to ?? Number.POSITIVE_INFINITY) <= pos.to + 1)
								editor.commands.insertContentAt(pos.to, "<p></p>");

							extension.options.onMount?.(editor, monaco);
						}}
					/>
					{languageSelector}
				</div>
				<div
					className={styles["detector-hidden"]}
					ref={(el) => {
						if (!el) return;
						selectionHandler.push([
							el,
							() => {
								if (!mcEditor) return;
								const model = mcEditor.getModel();
								if (!model) return;
								mcEditor.focus();
								if (isReverseKey(tiptapState.lastKeyPress ?? ""))
									mcEditor.setSelection(
										model.getFullModelRange().collapseToEnd(),
									);
								else
									mcEditor.setSelection(
										model.getFullModelRange().collapseToStart(),
									);
							},
						]);
					}}
				>
					```
				</div>
				{selected ? <div className={styles["highlight-overlay"]} /> : null}
			</div>
		</NodeViewWrapper>
	);
}
