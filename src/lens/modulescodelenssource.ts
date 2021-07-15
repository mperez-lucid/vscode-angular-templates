import * as vscode from 'vscode';

export class ModuleCodeLensSource implements vscode.CodeLensProvider {
    public get selector() {
        return {
          language: 'typescript',
          scheme: 'file',
          pattern: '**/*.module.ts',
        }
    }

    public async provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken) {
        const lenses = []

        lenses.push(new vscode.CodeLens(new vscode.Range(0,0,0,0), {title: 'Format ng-module', command: 'ngTemplates.formatNgModule', arguments: [document.uri]}));
        
        return lenses;
    }

    public resolveCodeLens(codeLens: vscode.CodeLens, cancellationToken: vscode.CancellationToken) {
        return codeLens;
    }

}