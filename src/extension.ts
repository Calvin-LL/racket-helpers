import vscode from "vscode";

import { hoistExpression } from "./hoistExpression";
import { expandSelection } from "./expandSelection";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "racket-helpers.expandSelection",
      expandSelection
    ),
    vscode.commands.registerTextEditorCommand(
      "racket-helpers.hoistExpression",
      hoistExpression
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate(): void {
  // nothing to do here
}
