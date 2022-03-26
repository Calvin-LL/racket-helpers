import vscode, {
  Range,
  Selection,
  TextEditor,
  TextEditorSelectionChangeKind,
} from "vscode";

import { expandSelection } from "./expandSelection";
import { closingBrackets, openingBrackets } from "./brackets";

// taken from https://github.com/antfu/vscode-smart-clicks/blob/9b42c4fa598274a267d8e96df5169d6a5d2ee163/src/index.ts

let last = 0;
let prevEditor: TextEditor | undefined;
let prevSelection: Selection | undefined;
let timer: NodeJS.Timeout;

export function detectDoubleClick(
  event: vscode.TextEditorSelectionChangeEvent
): void {
  clearTimeout(timer);

  const config = vscode.workspace.getConfiguration("racket-helpers");

  if (!config.get("enableDoubleClick", true)) {
    return;
  }

  if (event.kind !== TextEditorSelectionChangeKind.Mouse) {
    last = 0;
    return;
  }

  const selection = event.selections[0];
  const originalSelection = prevSelection;

  try {
    if (
      prevEditor !== event.textEditor ||
      !prevSelection ||
      !prevSelection.isEmpty ||
      event.selections.length !== 1 ||
      selection.start.line !== prevSelection.start.line ||
      Date.now() - last > config.get("clicksInterval", 600)
    ) {
      return;
    }
  } finally {
    prevEditor = event.textEditor;
    prevSelection = selection;
    last = Date.now();
  }

  timer = setTimeout(() => {
    if (originalSelection) {
      expandSelectionIfBracketDoubleClick(event.textEditor, originalSelection);
    }
  }, config.get("triggerDelay", 150));
}

function expandSelectionIfBracketDoubleClick(
  textEditor: TextEditor,
  selection: Selection
): boolean {
  const document = textEditor.document;
  const beforeActive = selection.active.translate(0, -1);
  const afterActive = selection.active.translate(0, 1);
  const characterBeforeActive = document.getText(
    new Range(beforeActive, selection.active)
  );
  const characterAfterActive = document.getText(
    new Range(selection.active, afterActive)
  );

  if (
    (characterBeforeActive &&
      openingBrackets.includes(characterBeforeActive)) ||
    (characterAfterActive && closingBrackets.includes(characterAfterActive))
  ) {
    textEditor.selection = selection;

    expandSelection();
  } else if (
    characterBeforeActive &&
    closingBrackets.includes(characterBeforeActive)
  ) {
    textEditor.selection = new Selection(beforeActive, beforeActive);

    expandSelection();
  } else if (
    characterAfterActive &&
    openingBrackets.includes(characterAfterActive)
  ) {
    textEditor.selection = new Selection(afterActive, afterActive);

    expandSelection();
  }

  return true;
}
