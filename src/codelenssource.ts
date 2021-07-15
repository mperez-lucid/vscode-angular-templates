import * as vscode from 'vscode';
import {parseBuildFile, findTargetName} from './file';
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
        const promptRanges: vscode.Range[] = parseBuildFile(document, token);
        const lenses = []
        promptRanges.forEach(range => {
            lenses.push(new vscode.CodeLens(range, {title: 'Build target', command: 'ngTemplates.buildBuild', arguments: [document.uri, findTargetName(document, range.start)]}));
        });

        // if(lenses.length == 0) {
        //     lenses.push(new vscode.CodeLens(new vscode.Range(0,0,0,0), {title: 'Build target', command: 'ngTemplates.buildBuild', arguments: [document.uri]}));
        // }

        lenses.push(new vscode.CodeLens(new vscode.Range(0,0,0,0), {title: 'Format TS', command: 'ngTemplates.formatTS', arguments: [document.uri]}));
        
        return lenses;
    }

    public resolveCodeLens(codeLens: vscode.CodeLens, cancellationToken: vscode.CancellationToken) {
        return codeLens;
    }

}