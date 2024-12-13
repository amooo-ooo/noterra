import { EditorContext } from "./editor";
import React from "react";

export function EditorStatsWidget({ className }: { className?: string }) {
    const { editor } = React.useContext(EditorContext);

    const countText = (count: number, singular: string, plural: string) =>
        `${count} ${count === 1 ? singular : plural}`;

    return (
        <div className={className}>
            <p>{countText(editor?.storage.characterCount.characters() ?? 0, "character", "characters")}</p>
            <p>{countText(editor?.storage.characterCount.words() ?? 0, "word", "words")}</p>
        </div>
    );
}
