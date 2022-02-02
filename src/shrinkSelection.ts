import vscode from "vscode";

import { selectionHistory } from "./selectionHistory";

export function shrinkSelection(): void {
  const textEditor = vscode.window.activeTextEditor;

  if (!textEditor) return;

  const lastSelection = selectionHistory.history.pop();

  if (!lastSelection) return;

  const latestSelection = selectionHistory.latest;

  if (!latestSelection) return;

  const selectionChanged = textEditor.selections.some(
    (currentSelection, index) =>
      !currentSelection.isEqual(latestSelection[index])
  );

  if (selectionChanged) return;

  textEditor.selections = lastSelection;
  selectionHistory.latest = lastSelection;
}
