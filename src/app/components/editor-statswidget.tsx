import type { SelCharCountStorage } from "../editor-extensions/char-count";
import { EditorContext } from "./editor";
import React from "react";

export function EditorStatsWidget({ className }: { className?: string }) {
	const { editor } = React.useContext(EditorContext);

	const countText = (count: number, singular: string, plural: string) =>
		`${count} ${count === 1 ? singular : plural}`;
	const charCount: SelCharCountStorage | undefined =
		editor?.storage.characterCount;

	return (
		<div className={className}>
			<p>
				{countText(charCount?.characters() ?? 0, "character", "characters")}
			</p>
			<p>{countText(charCount?.words() ?? 0, "word", "words")}</p>
		</div>
	);
}
