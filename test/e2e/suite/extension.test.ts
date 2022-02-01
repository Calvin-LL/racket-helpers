import { fail } from "assert";

import vscode, {
  Position,
  Selection,
  TextDocument,
  TextEditor,
  Uri,
} from "vscode";
import { expect } from "chai";

const testCode = `
(test-suite
  "implement-fvars"

  (test-case
   "simple (test)"
   (check-equal? (implement-fvars
                  '(begin
                     (set! r10 fv0)
                     (set! r11 fv1)
                     (set! r10 (+ r10 r11))
                     (set! fv0 r10)
                     (set! rax fv0)))
                 '(begin
                    (set! r10 (rbp - 0))
                    (set! r11 (rbp - 8))
                    (set! r10 (+ r10 r11))
                    (set! (rbp - 0) r10)
                    (set! rax (rbp - 0))))))`.trimStart();

const testDocumentUri = Uri.parse("untitled:./test.rkt");
let testDocument: TextDocument | undefined;
let textEditor: TextEditor | undefined;

suiteSetup(async () => {
  testDocument = await vscode.workspace.openTextDocument(testDocumentUri);
  textEditor = await vscode.window.showTextDocument(testDocument, 1, false);
});

setup(async () => {
  await reloadTestCode();
});

suite("expandSelection", () => {
  test("Expand from no selection", async () => {
    if (!textEditor) fail();

    const position = new Position(7, 33);

    textEditor.selection = new Selection(position, position);

    await vscode.commands.executeCommand("racket-helpers.expandSelection");

    const selectedTexts = getSelectedTexts();

    expect(selectedTexts).to.have.lengthOf(1);
    expect(selectedTexts[0]).to.be.equal("(set! r10 fv0)");
  });

  testBothDirections(
    "Expand from inner selection",
    new Selection(new Position(7, 27), new Position(7, 30)),
    async (selection) => {
      if (!textEditor) fail();

      textEditor.selection = selection;

      await vscode.commands.executeCommand("racket-helpers.expandSelection");

      const selectedTexts = getSelectedTexts();

      expect(selectedTexts).to.have.lengthOf(1);
      expect(selectedTexts[0]).to.be.equal("(set! r10 fv0)");
    }
  );

  testBothDirections(
    "Expand from open paren selection",
    new Selection(new Position(7, 21), new Position(7, 22)),
    async (selection) => {
      if (!textEditor) fail();

      textEditor.selection = selection;

      await vscode.commands.executeCommand("racket-helpers.expandSelection");

      const selectedTexts = getSelectedTexts();

      expect(selectedTexts).to.have.lengthOf(1);
      expect(selectedTexts[0]).to.be.equal("(set! r10 fv0)");
    }
  );

  testBothDirections(
    "Expand from closing paren selection",
    new Selection(new Position(7, 34), new Position(7, 35)),
    async (selection) => {
      if (!textEditor) fail();

      textEditor.selection = selection;

      await vscode.commands.executeCommand("racket-helpers.expandSelection");

      const selectedTexts = getSelectedTexts();

      expect(selectedTexts).to.have.lengthOf(1);
      expect(selectedTexts[0]).to.be.equal("(set! r10 fv0)");
    }
  );

  testBothDirections(
    "Expand from s-exp selection",
    new Selection(new Position(7, 21), new Position(7, 35)),
    async (selection) => {
      if (!textEditor) fail();

      textEditor.selection = selection;

      await vscode.commands.executeCommand("racket-helpers.expandSelection");

      const selectedTexts = getSelectedTexts();

      expect(selectedTexts).to.have.lengthOf(1);
      expect(selectedTexts[0]).to.be.equal(
        `
    (begin
                     (set! r10 fv0)
                     (set! r11 fv1)
                     (set! r10 (+ r10 r11))
                     (set! fv0 r10)
                     (set! rax fv0))`.trimStart()
      );
    }
  );

  testBothDirections(
    "Expand from multi-line selection",
    new Selection(new Position(7, 21), new Position(8, 35)),
    async (selection) => {
      if (!textEditor) fail();

      textEditor.selection = selection;

      await vscode.commands.executeCommand("racket-helpers.expandSelection");

      const selectedTexts = getSelectedTexts();

      expect(selectedTexts).to.have.lengthOf(1);
      expect(selectedTexts[0]).to.be.equal(
        `
    (begin
                     (set! r10 fv0)
                     (set! r11 fv1)
                     (set! r10 (+ r10 r11))
                     (set! fv0 r10)
                     (set! rax fv0))`.trimStart()
      );
    }
  );

  testBothDirections(
    "Do not expand when everything is selected",
    new Selection(new Position(0, 0), new Position(17, 44)),
    async (selection) => {
      if (!textEditor) fail();

      textEditor.selection = selection;

      await vscode.commands.executeCommand("racket-helpers.expandSelection");

      const selectedTexts = getSelectedTexts();

      expect(selectedTexts).to.have.lengthOf(1);
      expect(selectedTexts[0]).to.be.equal(testCode);
    }
  );
});

suite("hoistExpression", () => {
  test("Hoist from no selection", async () => {
    if (!textEditor) fail();

    const position = new Position(7, 33);

    textEditor.selection = new Selection(position, position);

    const [documentText] = await Promise.all([
      getDocumentTextOnChange(),
      vscode.commands.executeCommand("racket-helpers.hoistExpression"),
    ]);

    expect(documentText).to.be.equal(
      `
(test-suite
  "implement-fvars"

  (test-case
   "simple (test)"
   (check-equal? (implement-fvars
                  '(set! r10 fv0))
                 '(begin
                    (set! r10 (rbp - 0))
                    (set! r11 (rbp - 8))
                    (set! r10 (+ r10 r11))
                    (set! (rbp - 0) r10)
                    (set! rax (rbp - 0))))))`.trimStart()
    );
  });

  testBothDirections(
    "Hoist inner selection",
    new Selection(new Position(7, 27), new Position(7, 30)),
    async (selection) => {
      if (!textEditor) fail();

      textEditor.selection = selection;

      const [documentText] = await Promise.all([
        getDocumentTextOnChange(),
        vscode.commands.executeCommand("racket-helpers.hoistExpression"),
      ]);

      expect(documentText).to.be.equal(
        `
(test-suite
  "implement-fvars"

  (test-case
   "simple (test)"
   (check-equal? (implement-fvars
                  '(begin
                     r10
                     (set! r11 fv1)
                     (set! r10 (+ r10 r11))
                     (set! fv0 r10)
                     (set! rax fv0)))
                 '(begin
                    (set! r10 (rbp - 0))
                    (set! r11 (rbp - 8))
                    (set! r10 (+ r10 r11))
                    (set! (rbp - 0) r10)
                    (set! rax (rbp - 0))))))`.trimStart()
      );
    }
  );

  testBothDirections(
    "Hoist s-exp selection",
    new Selection(new Position(7, 21), new Position(7, 35)),
    async (selection) => {
      if (!textEditor) fail();

      textEditor.selection = selection;

      const [documentText] = await Promise.all([
        getDocumentTextOnChange(),
        vscode.commands.executeCommand("racket-helpers.hoistExpression"),
      ]);

      expect(documentText).to.be.equal(
        `
(test-suite
  "implement-fvars"

  (test-case
   "simple (test)"
   (check-equal? (implement-fvars
                  '(set! r10 fv0))
                 '(begin
                    (set! r10 (rbp - 0))
                    (set! r11 (rbp - 8))
                    (set! r10 (+ r10 r11))
                    (set! (rbp - 0) r10)
                    (set! rax (rbp - 0))))))`.trimStart()
      );
    }
  );

  testBothDirections(
    "Do not hoist when everything is selected",
    new Selection(new Position(0, 0), new Position(17, 44)),
    async (selection) => {
      if (!textEditor) fail();

      textEditor.selection = selection;

      const [documentText] = await Promise.all([
        getDocumentTextOnChange(),
        vscode.commands.executeCommand("racket-helpers.hoistExpression"),
      ]);

      expect(documentText).to.be.equal(testCode);
    }
  );
});

function testBothDirections(
  name: string,
  selection: Selection,
  func: (selection: Selection) => Promise<void>
): void {
  suite(name, () => {
    test("forward", async () => {
      await func(new Selection(selection.anchor, selection.active));
    });
    test("backward", async () => {
      await func(new Selection(selection.active, selection.anchor));
    });
  });
}

async function getDocumentTextOnChange(): Promise<string> {
  return await new Promise((resolve) => {
    vscode.workspace.onDidChangeTextDocument(() => {
      resolve(getDocumentText());
    });
  });
}

function getSelectedTexts(): string[] {
  if (!textEditor) return [];

  return textEditor.selections.map((selection) =>
    (textEditor as TextEditor).document.getText(selection)
  );
}

function getDocumentText(): string {
  if (!testDocument) return "";

  const beginPosition = new Position(0, 0);
  const endPosition = testDocument.lineAt(testDocument.lineCount - 1).range.end;
  const fullDocumentSelection = new Selection(beginPosition, endPosition);

  return testDocument.getText(fullDocumentSelection);
}

async function reloadTestCode(): Promise<void> {
  if (!textEditor) return;

  await textEditor.edit((editBuilder) => {
    if (!testDocument) return;

    const beginPosition = new Position(0, 0);
    const endPosition = testDocument.lineAt(testDocument.lineCount - 1).range
      .end;
    // replace all text with test code
    editBuilder.replace(new Selection(beginPosition, endPosition), testCode);
  });
}
