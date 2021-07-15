import * as vscode from 'vscode';
import {parseBuildFile} from './file';
import * as path from 'path';

export class CodeLensSource implements vscode.CodeLensProvider {
    private configuration = vscode.workspace.getConfiguration('jasmine-bazel');

    public get selector() {
        return {
          language: 'bazel',
          scheme: 'file',
          pattern: '**/BUILD.bazel',
        }
    }

    public async provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken) {
        // const prompt = parseBuildFile(document.getText())
        const lense = new vscode.CodeLens(new vscode.Range(0,0,0,0), {title: 'Build target', command: 'ngTemplates.buildBuild', arguments: [document.uri]});
        
        return [lense];
    }

    public resolveCodeLens(codeLens: vscode.CodeLens, cancellationToken: vscode.CancellationToken) {
        return codeLens;
    }

}