import { TextEditor } from "vscode";

import { expandSelection } from "./expandSelection";

export async function hoistExpression(editor: TextEditor): Promise<void> {
  if (editor.selections.length === 1 && editor.selections[0].isEmpty) {
    // nothing is selected
    await expandSelection();

    const innerExpression = editor.selections[0];

    await expandSelection();

    await editor.edit((editBuilder) => {
      editBuilder.replace(
        editor.selections[0],
        editor.document.getText(innerExpression)
      );
    });
  } else {
    const innerExpressions = editor.selections;

    await expandSelection();

    if (innerExpressions.length !== editor.selections.length) return;

    await editor.edit((editBuilder) => {
      editor.selections.forEach((selection, index) => {
        editBuilder.replace(
          selection,
          editor.document.getText(innerExpressions[index])
        );
      });
    });
  }
}
