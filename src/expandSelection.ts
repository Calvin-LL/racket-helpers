import vscode, { Position, Range, Selection, TextDocument } from "vscode";

import { selectionHistory } from "./selectionHistory";
import {
  closingBracketMap,
  closingBrackets,
  openingBracketMap,
  openingBrackets,
} from "./brackets";

export function expandSelection(): void {
  const textEditor = vscode.window.activeTextEditor;

  if (!textEditor) return;

  const originalSelections = textEditor.selections;

  let selectionChanged = false;

  textEditor.selections = textEditor.selections.map((selection) => {
    const bracketPair = getBracketPair(textEditor.document, selection.active);

    if (!bracketPair) return selection;

    selectionChanged = true;

    return bracketPair;
  });

  if (selectionChanged) {
    selectionHistory.history.push(originalSelections);
    selectionHistory.latest = textEditor.selections;
  }
}

export function getBracketPair(
  document: TextDocument,
  position: Position
): Selection | undefined {
  const bracketStack: string[] = [];

  // find opening bracket

  let openingBracketPosition: Position | undefined;

  lineLoop: for (let i = position.line; i >= 0; i--) {
    const startingPosition =
      i === position.line
        ? position.character - 1
        : document.lineAt(i).text.length;

    for (let j = startingPosition; j >= 0; j--) {
      const character = document.getText(new Range(i, j, i, j + 1));

      if (closingBrackets.includes(character)) {
        bracketStack.push(character);
      } else if (openingBrackets.includes(character)) {
        const topBracket = bracketStack[bracketStack.length - 1];

        if (topBracket && closingBracketMap[topBracket] === character) {
          bracketStack.pop();
        } else {
          openingBracketPosition = new Position(i, j);
          break lineLoop;
        }
      }
    }
  }

  // find closing bracket

  let closingBracketPosition: Position | undefined;

  lineLoop: for (let i = position.line; i < document.lineCount; i++) {
    const startingPosition = i === position.line ? position.character : 0;

    for (let j = startingPosition; j < document.lineAt(i).text.length; j++) {
      const character = document.getText(new Range(i, j, i, j + 1));

      if (openingBrackets.includes(character)) {
        bracketStack.push(character);
      } else if (closingBrackets.includes(character)) {
        const topBracket = bracketStack[bracketStack.length - 1];

        if (topBracket && openingBracketMap[topBracket] === character) {
          bracketStack.pop();
        } else {
          closingBracketPosition = new Position(i, j + 1);
          break lineLoop;
        }
      }
    }
  }

  if (!openingBracketPosition || !closingBracketPosition) return undefined;

  return new Selection(openingBracketPosition, closingBracketPosition);
}
