import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { CancellationToken, TextDocument } from 'vscode';

export function writeFile(path: string, content: string): Promise<any> {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, content, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(1);
            }
        });
    });
}

export function findModules(inDirectory: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        fs.readdir(inDirectory, (err, items) => {
            if (err) {
                reject(err);
            } else {
                const result = items.filter(item =>
                    item.indexOf('.module.ts') !== -1
                ).map(item => path.join(inDirectory, item));

                const next = path.join(inDirectory, '..');

                const doNext = (vscode.workspace.workspaceFolders || []).some((folder) => {
                    return path.relative(folder.uri.fsPath, next).substr(0, 2) !== '..';
                });

                if (doNext) {
                    findModules(next).then((moreModules) => {
                        resolve(result.concat(moreModules));
                    }, reject);
                } else {
                    resolve(result);
                }
            }
        });
    });
}

export function findBuild(inDirectory: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readdir(inDirectory, (err, items) => {
            if (err) {
                reject(err);
            } else {
                const index = items.indexOf('BUILD.bazel');

                if(index != -1) {
                    resolve(path.join(inDirectory, 'BUILD.bazel'));
                }

                const next = path.join(inDirectory, '..');

                const doNext = (vscode.workspace.workspaceFolders || []).some((folder) => {
                    return path.relative(folder.uri.fsPath, next).substr(0, 2) !== '..';
                });

                if (doNext) {
                    findBuild(next).then((moreBuilds) => {
                        resolve(moreBuilds);
                    }, reject);
                } else {
                    reject('Could not find BUILD file.');
                }
            }
        });
    });
}

export function parseBuildFile(document: TextDocument, token: CancellationToken) {
    const text = document.getText();
    
    
    const ngProjectIndex = text.lastIndexOf('ng_project');
    const isNgProject = ngProjectIndex != -1;
    const tsProjectIndex = text.lastIndexOf('ts_project');
    const index = Math.max(ngProjectIndex, tsProjectIndex);
    if (token.isCancellationRequested || index == -1) {
        return {range: [], isNgProject: false};
    }
    return {range: [new vscode.Range(document.positionAt(index), document.positionAt(index))], isNgProject: isNgProject};
}

export function lookForKarmaTests(document: TextDocument, token: CancellationToken) {
    const text = document.getText();
    
    const index = text.lastIndexOf('karma_test');
    if (token.isCancellationRequested || index == -1) {
        return {range: [], foundTest: false};
    }
    return {range: [new vscode.Range(document.positionAt(index), document.positionAt(index))], foundTest: true};
}

export function findTargetName(document: TextDocument, position: vscode.Position) {
    const projectLine = document.lineAt(position.line);
    const subText = document.getText(new vscode.Range(projectLine.range.start, new vscode.Position(document.lineCount - 1, 0)));
    const lineIndex = subText.indexOf('name = ');
    const line = document.lineAt(document.positionAt(lineIndex).line + projectLine.lineNumber + 1);
    const match = line.text.match(/\"\w+\"/g);
    const name = match[0].substring(1, match[0].length-1);
    return name;
}

export function findComponents(inDirectory: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        fs.readdir(inDirectory, (err, items) => {
            if (err) {
                reject(err);
            } else {
                const foundBuildFile = items.find(item => item.indexOf('BUILD.bazel') !== -1);
                if(foundBuildFile) {
                    resolve(false);
                }

                const foundComponent = items.find(item => item.indexOf('.component.ts') !== -1);
                if(foundComponent) {
                    resolve(true);
                }

                const subfolders = items.filter(item => item.indexOf('.') === -1);
                if(subfolders.length == 0) {
                    resolve(false);
                }
                subfolders.forEach(subfolder => {
                    findComponents(path.join(inDirectory, subfolder)).then(foundComponent => {
                        resolve(foundComponent);
                    });
                });
            }
        });
    });
}

export function findScalaFiles(inDirectory: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        fs.readdir(inDirectory, (err, items) => {
            if (err) {
                reject(err);
            } else {
                const foundBuildFile = items.find(item => item.indexOf('BUILD.bazel') !== -1);
                if(foundBuildFile) {
                    resolve(false);
                }

                const foundScalaFile = items.find(item => item.indexOf('.scala') !== -1);
                if(foundScalaFile) {
                    resolve(true);
                }

                const subfolders = items.filter(item => item.indexOf('.') === -1);
                if(subfolders.length == 0) {
                    resolve(false);
                }
                subfolders.forEach(subfolder => {
                    findComponents(path.join(inDirectory, subfolder)).then(foundScalaFile => {
                        resolve(foundScalaFile);
                    });
                });
                resolve(false);
            }
        });
    });
}

export function ensureDot(relativePath: string): string {
    if (relativePath[0] === '.') {
        return relativePath;
    } else {
        return './' + relativePath;
    }
}