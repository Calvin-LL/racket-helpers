import vscode from "vscode";

import { shrinkSelection } from "./shrinkSelection";
import { hoistExpression } from "./hoistExpression";
import { expandSelection } from "./expandSelection";
import { detectDoubleClick } from "./detectDoubleClick";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "racket-helpers.shrinkSelection",
      shrinkSelection
    ),
    vscode.commands.registerCommand(
      "racket-helpers.expandSelection",
      expandSelection
    ),
    vscode.commands.registerTextEditorCommand(
      "racket-helpers.hoistExpression",
      hoistExpression
    ),
    vscode.window.onDidChangeTextEditorSelection(detectDoubleClick)
  );
}

// this method is called when your extension is deactivated
export function deactivate(): void {
  // nothing to do here
}
