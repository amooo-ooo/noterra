"use client";
import { Editor } from "@monaco-editor/react";
import type { Transaction } from "@tiptap/pm/state";
import {
	type Editor as TiptapEditor,
	type NodeViewProps,
	NodeViewWrapper,
} from "@tiptap/react";
import "./monaco-node-extension";
import type { editor } from "monaco-editor";
import React, { useEffect } from "react";
import { EditorContext } from "./editor";
import styles from "@/app/styles/monaco-editor.module.css";

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
	// updateAttributes,
	// deleteNode,
}: NodeViewProps) {
	const [height, setHeight] = React.useState(0);
	const [mcEditor, setMcEditor] =
		React.useState<editor.IStandaloneCodeEditor>();
	const containerRef = React.useRef<HTMLDivElement | null>(null);

	const tiptapState = React.useContext(EditorContext);
	const selectionHandler = React.useContext(SelectionHandler);
	const content = node.content.content.map((node) => node.textContent).join("");

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const callback = ({
			editor,
			transaction,
		}: { editor: TiptapEditor; transaction: Transaction }) => {
			if (transaction.selection.$head.parent === node) {
				const pos = editor.$pos(getPos() + 1 /* TODO: WHY?? */);
				editor.commands.setTextSelection({
					from: transaction.selection.anchor,
					to: isReverseKey(tiptapState.lastKeyPress ?? "")
						? pos.from - 2
						: pos.to + 1,
				});
			}
		};
		editor.on("selectionUpdate", callback);
		return () => {
			editor.off("selectionUpdate", callback);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [editor, node, getPos]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		setHeight(mcEditor?.getContentHeight() ?? 0);
		// editorRef.current?.setValue(node.attrs.content);
	}, [content, mcEditor]);

	useEffect(() => {
		return mcEditor?.onKeyDown((e) => {
			if (e.code !== "Backspace" && e.code !== "Delete") return;
			const selections = mcEditor.getSelections();
			if (!selections?.length || selections.length > 1) return;
			const selection = selections[0];
			if (!selection.isEmpty()) return;
			if (
				e.code === "Backspace" &&
				!mcEditor
					.getModel()
					?.getFullModelRange()
					.getStartPosition()
					.equals(selection.getPosition())
			)
				return;
			if (
				e.code === "Delete" &&
				!mcEditor
					.getModel()
					?.getFullModelRange()
					.getEndPosition()
					.equals(selection.getPosition())
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

	useEffect(() => {
		if (!mcEditor) return;
		let timer: ReturnType<typeof setTimeout>;
		const keyHandler = mcEditor.onKeyDown((e) => {
			if (!e.code.startsWith("Arrow")) return;
			const selection = mcEditor.getSelection();
			if (!selection || selection.isEmpty())
				timer = setTimeout(() => {
					// TODO: fix this jank
					const pos = editor.$pos(getPos() + 1 /* WHY */);
					if ((pos.parent?.to ?? Number.POSITIVE_INFINITY) <= pos.to + 1)
						editor.commands.insertContentAt(pos.to, "<p></p>");
					editor.commands.focus(
						e.code === "ArrowUp" || e.code === "ArrowLeft"
							? pos.from - 2 // WHY
							: pos.to + 1,
					);
				}, 0);
		});
		const cursorHandler = mcEditor.onDidChangeCursorPosition(() => {
			// TODO: scroll handling
			clearTimeout(timer);
		});
		return () => {
			keyHandler.dispose();
			cursorHandler.dispose();
		};
	}, [editor, mcEditor, getPos]);

	return (
		<NodeViewWrapper ref={containerRef} className={styles.container}>
			<span
				className={styles["detector-hidden"]}
				ref={(el) => {
					if (!el) return;
					selectionHandler.push([
						el,
						(selection) => {
							if (!selection.isCollapsed) {
								selection.extend(el);
								return;
							}
							if (!mcEditor) return;
							const model = mcEditor.getModel();
							if (!model) return;
							mcEditor.focus();
							mcEditor.setSelection(
								model.getFullModelRange().collapseToStart(),
							);
						},
					]);
				}}
			>
				```
			</span>
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
						setHeight(mcEditor?.getContentHeight() ?? 0);
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
						mcEditor.focus();
						setHeight(mcEditor?.getContentHeight() ?? 0);

						const pos = editor.$pos(getPos() + 1 /* WHY */);
						if ((pos.parent?.to ?? Number.POSITIVE_INFINITY) <= pos.to + 1)
							editor.commands.insertContentAt(pos.to, "<p></p>");

						extension.options.onMount?.(editor, monaco);
					}}
				/>
			</div>
			<span
				className={styles["detector-hidden"]}
				ref={(el) => {
					if (!el) return;
					selectionHandler.push([
						el,
						(selection) => {
							if (!selection.isCollapsed) {
								selection.extend(el);
								return;
							}
							if (!mcEditor) return;
							const model = mcEditor.getModel();
							if (!model) return;
							mcEditor.focus();
							mcEditor.setSelection(model.getFullModelRange().collapseToEnd());
						},
					]);
				}}
				onChange={console.log}
				onInput={console.log}
			>
				```
			</span>
			{selected ? <div className={styles["select-overlay"]} /> : null}
		</NodeViewWrapper>
	);
}
