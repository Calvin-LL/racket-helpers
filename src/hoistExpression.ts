import { Position, Selection, TextEditor } from "vscode";

import { getBracketPair } from "./expandSelection";

export async function hoistExpression(editor: TextEditor): Promise<void> {
  // we ignore multiple selections

  const originalSelection = editor.selection;
  const innerExpression = editor.selection.isEmpty
    ? getBracketPair(editor.document, editor.selection.active)
    : originalSelection;

  if (!innerExpression) return;

  const outerExpression = getBracketPair(
    editor.document,
    innerExpression.active
  );

  if (!outerExpression) return;

  await editor.edit((editBuilder) => {
    editBuilder.replace(
      outerExpression,
      editor.document.getText(innerExpression)
    );
  });

  const newSelection = getNewSelection(
    originalSelection,
    innerExpression,
    outerExpression
  );
  const selectionsCopy = [...editor.selections];

  selectionsCopy[0] = newSelection;

  editor.selections = selectionsCopy;
}

/**
 * We want the selection/cursor to be at the same place relative to the inner expression
 */
function getNewSelection(
  originalSelection: Selection,
  innerExpression: Selection,
  outerExpression: Selection
): Selection {
  const lineDifference =
    innerExpression.start.line - outerExpression.start.line;
  const characterDifference =
    innerExpression.start.character - outerExpression.start.character;

  const newAnchorPosition = new Position(
    originalSelection.anchor.line - lineDifference,
    originalSelection.anchor.character - characterDifference
  );
  const newActivePosition = new Position(
    originalSelection.active.line - lineDifference,
    originalSelection.anchor.line === originalSelection.active.line
      ? originalSelection.active.character - characterDifference
      : originalSelection.active.character
  );

  return new Selection(newAnchorPosition, newActivePosition);
}
