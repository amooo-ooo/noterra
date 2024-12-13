import { EditorContext } from "./editor";
import React from "react";

export function EditorStatsWidget({ className }: { className?: string }) {
    const { editor } = React.useContext(EditorContext)
    return (
        <div className={className}>
            <p>{editor?.storage.characterCount.characters() ?? 0}</p>
            <p>{editor?.storage.characterCount.words() ?? 0}</p>
        </div>
    );
}
