import vscode, { Selection } from "vscode";

export const selectionHistory: {
  history: (readonly Selection[])[];
  latest: readonly Selection[] | undefined;
} = {
  history: [],
  latest: undefined,
};

vscode.window.onDidChangeActiveTextEditor(() => {
  selectionHistory.history = [];
});

vscode.workspace.onDidChangeTextDocument(() => {
  selectionHistory.history = [];
});
