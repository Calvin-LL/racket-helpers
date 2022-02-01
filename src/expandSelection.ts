import vscode, { Position, Selection, TextDocument } from "vscode";

export async function expandSelection(): Promise<void> {
  const textEditor = vscode.window.activeTextEditor;

  if (!textEditor) return;

  const beforeSelections = textEditor.selections;

  await vscode.commands.executeCommand("editor.action.selectToBracket");

  const afterSelections = textEditor.selections;

  // if some selections consolidated
  if (beforeSelections.length !== afterSelections.length) return;

  const failedExpansions = afterSelections.map((selection, index) => {
    return (
      selection.isEqual(beforeSelections[index]) ||
      !selection.contains(beforeSelections[index])
    );
  });
  const someSelectionFailed = failedExpansions.includes(true);

  // if all selections are different
  if (!someSelectionFailed) return;

  // for the selections that stayed the same,
  // expand the original selection by 1 character on each end
  // then call the command again
  // to select the parent expression
  textEditor.selections = beforeSelections.map((selection, index) => {
    if (failedExpansions[index]) {
      const document = textEditor.document;
      const expandedSelection = expandSelectionBy1Character(
        document,
        selection
      );

      if (!expandedSelection) return selection;

      return expandedSelection;
    }
    return selection;
  });

  await vscode.commands.executeCommand("editor.action.selectToBracket");
}

/**
 * @returns {(Selection | undefined)} a selection that is expanded by 1 character on each end
 */
function expandSelectionBy1Character(
  document: TextDocument,
  selection: Selection
): Selection | undefined {
  const inOrder = selection.anchor.isBefore(selection.active);

  const previousCharacter = getPositionPreviousCharacter(
    document,
    inOrder ? selection.anchor : selection.active
  );
  const nextCharacter = getPositionNextCharacter(
    document,
    inOrder ? selection.active : selection.anchor
  );

  if (!previousCharacter || !nextCharacter) return undefined;

  return new Selection(previousCharacter, nextCharacter);
}

function getPositionPreviousCharacter(
  document: TextDocument,
  position: Position
): Position | undefined {
  if (position.character > 0) {
    return new Position(position.line, position.character - 1);
  }

  if (position.line > 0) {
    return new Position(
      position.line - 1,
      document.lineAt(position.line - 1).text.length
    );
  }

  return undefined;
}

function getPositionNextCharacter(
  document: TextDocument,
  position: Position
): Position | undefined {
  if (position.character < document.lineAt(position.line).text.length) {
    return new Position(position.line, position.character + 1);
  }

  if (position.line < document.lineCount - 1) {
    return new Position(position.line + 1, 0);
  }

  return undefined;
}
