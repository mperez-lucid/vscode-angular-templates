import * as vscode from 'vscode';
import {parseBuildFile, findTargetName, lookForKarmaTests} from '../file';

export class BazelCodeLensSource implements vscode.CodeLensProvider {
    public get selector() {
        return {
          language: 'bazel',
          scheme: 'file',
          pattern: '**/BUILD.bazel',
        }
    }

    public async provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken) {
        const parsedFile = parseBuildFile(document, token);
        const karmaTests = lookForKarmaTests(document, token);
        const promptRanges: vscode.Range[] = parsedFile.range;
        const lenses = []
        promptRanges.forEach(range => {
            if(parsedFile.isNgProject) {
                lenses.push(new vscode.CodeLens(range, {title: 'Format ng-module', command: 'ngTemplates.formatNgModule', arguments: [document.uri]}));
            }
            lenses.push(new vscode.CodeLens(range, {title: 'Build target', command: 'ngTemplates.buildBuild', arguments: [document.uri, findTargetName(document, range.start)]}));
            lenses.push(new vscode.CodeLens(range, {title: 'Format TS', command: 'ngTemplates.formatTS', arguments: [document.uri]}));
        });
        karmaTests.range.forEach(karmaRange => {
            lenses.push(new vscode.CodeLens(karmaRange, {title: 'Run tests', command: 'ngTemplates.runTests', arguments: [document.uri, findTargetName(document, karmaRange.start)]}));
            
        })


        return lenses;
    }

    public resolveCodeLens(codeLens: vscode.CodeLens, cancellationToken: vscode.CancellationToken) {
        return codeLens;
    }

}