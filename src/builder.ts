'use strict';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import {writeFile, findBuild, findComponents, findScalaFiles} from './file';
import {BazelCodeLensSource} from './lens/bazelcodelenssource';
import { ModuleCodeLensSource } from './lens/modulescodelenssource';

enum BuildFileType {
    ng_project = "ng_project",
    scala_library = "scala_library",
    ts_project = "ts_project"
}


function getBazelTemplate(folderPath: string, buildType: string) {
    if(buildType == BuildFileType.scala_library) {
        return `load("@rules_scala_annex//rules:scala_with_scalafmt.bzl", "scala_library")

scala_library(
    name = "${path.basename(folderPath)}",
    srcs = glob(["*.scala"]),
    format = True,
    visibility = ["//visibility:public"],
    deps = [
    ],
)
    `
    }
    
    return `load("//cake/build/bazel:${buildType}.bzl", "${buildType}")

package(default_visibility = ["//visibility:public"])

${buildType}(
    name = "${path.basename(folderPath)}",
    module_name = "${getLucidPrefixedPath(folderPath)}",
    tsconfig = "//cake/app/webroot/ts:tsconfig.111.json",
    deps=[

    ],
)
`;
}

function getLucidPrefixedPath(path: string): string {
    const index = path.indexOf('cake/app/webroot/ts');
    return '@lucid' + path.substring(index + 19);
}

function createBuildFile(inFolder: string, buildType: string):Promise<any> {
    const buildPath = path.join(inFolder, "BUILD.bazel");
    if (fs.existsSync(buildPath)) {
        return Promise.reject(new Error("BUILD file already exists in " + inFolder));
    } else {
        return new Promise((resolve, reject) => {
            writeFile(buildPath, getBazelTemplate(inFolder, buildType)).then(resolve, reject);
        }).then(() => {
            return vscode.workspace.openTextDocument(buildPath).then((textDoc) => {
                return vscode.window.showTextDocument(textDoc);
            });
        });
    }
}

export async function getBuildType(inFolder: string): Promise<string> {
    const isComponent = findComponents(inFolder).then(foundComponent => {
        if(foundComponent) {
            return true;
        } else {
            return false;
        }
    });
    if(await isComponent) {
        return BuildFileType.ng_project;
    }
    const isScalaFile = findScalaFiles(inFolder).then(foundScalaFile => {
        if(foundScalaFile) {
            return true;
        } else {
            return false;
        }
    })
    const buildType = (await isScalaFile) ? BuildFileType.scala_library : BuildFileType.ts_project;
    return buildType;
}

export async function goToBuild(inDirectory: string) {
    findBuild(inDirectory).then(buildPath => {
        if(buildPath) {
            return vscode.workspace.openTextDocument(buildPath).then((textDoc) => {
                return vscode.window.showTextDocument(textDoc);
            });
        } else {
            vscode.window.showErrorMessage('No path found for BUILD file.');
        }
    });
}

function buildBuild(uri: vscode.Uri, targetName?: string) {
    const workspace = vscode.workspace.getWorkspaceFolder(uri);
    if (workspace) {
        const terminal = vscode.window.activeTerminal;
        terminal.show(true);
        const pathToWorkspace = path.relative(process.cwd(), workspace.uri.path);
        const pathToFile = path.dirname(path.relative(pathToWorkspace, uri.path)) + ':' + (targetName ? targetName : path.basename(path.dirname(uri.path)));
        const consoleCommand = `bazel build ${pathToFile}`;
        terminal.sendText(consoleCommand, true);
    } else {
        vscode.window.showErrorMessage('Could not find VS Code workspace.');
    }
}

function formatFolder(uri: vscode.Uri) {
    const workspace = vscode.workspace.getWorkspaceFolder(uri);
    if (workspace) {
        const terminal = vscode.window.activeTerminal;
        terminal.show(true);
        const pathToWorkspace = path.relative(process.cwd(), workspace.uri.path);
        const pathToFile = path.dirname(path.relative(pathToWorkspace, uri.path));
        const consoleCommand = `bazel format ts --target-filter "**/${pathToFile}"`;
        terminal.sendText(consoleCommand, true);
    } else {
        vscode.window.showErrorMessage('Could not find VS Code workspace.');
    }
}

function formatModules(uri: vscode.Uri) {
    const workspace = vscode.workspace.getWorkspaceFolder(uri);
    if (workspace) {
        const terminal = vscode.window.activeTerminal;
        const isBuildFile = path.basename(uri.path) == 'BUILD.bazel';
        terminal.show(true);
        const pathToWorkspace = path.relative(process.cwd(), workspace.uri.path);
        const pathToFile = path.dirname(path.relative(pathToWorkspace, uri.path));
        const consoleCommand = 
            isBuildFile ? `bazel format ng-module --target-filter "**/${pathToFile}"` 
                        : `bazel format ng-module --file-filter "**/${pathToFile}/${path.basename(uri.path)}"`;
        terminal.sendText(consoleCommand, true);
    } else {
        vscode.window.showErrorMessage('Could not find VS Code workspace.');
    }
}

export function activate(context: vscode.ExtensionContext) {
    const createBuildFileListener = vscode.commands.registerCommand('ngTemplates.create-build-file', (uri: vscode.Uri) => {
        if (!uri.fsPath) {
            vscode.window.showErrorMessage('No folder selected to contain new build file');
            return;
        }

        getBuildType(uri.fsPath).then((buildType) => {
            return createBuildFile(uri.fsPath, buildType);
        }).catch((err) => {
            vscode.window.showErrorMessage(err.toString());
            console.error(err);
        });
    });
    context.subscriptions.push(createBuildFileListener);

    const findBuildListener = vscode.commands.registerCommand('ngTemplates.find-build', (uri: vscode.Uri) => {
        if (!uri.fsPath) {
            vscode.window.showErrorMessage('No folder selected to find a BUILD file');
            return;
        }
        const buildPath = path.dirname(path.basename(uri.fsPath) == 'BUILD.bazel' ?
            path.dirname(uri.fsPath) : uri.fsPath);
        goToBuild(buildPath);
    });
    context.subscriptions.push(findBuildListener);

    const formatTsListener = vscode.commands.registerCommand('ngTemplates.formatTS', (uri: vscode.Uri) => {
        formatFolder(uri);
    });
    context.subscriptions.push(formatTsListener);

    const formatNgModule = vscode.commands.registerCommand('ngTemplates.formatNgModule', (uri: vscode.Uri) => {
        formatModules(uri);
    });

    const buildBuildListener = vscode.commands.registerCommand('ngTemplates.buildBuild', (uri: vscode.Uri, targetName: string) => {
        buildBuild(uri, targetName);
    });

    const bazelCodeLensSource = new BazelCodeLensSource();
	const bazelCodeLensDisposable = vscode.languages.registerCodeLensProvider(bazelCodeLensSource.selector, bazelCodeLensSource);
    context.subscriptions.push(bazelCodeLensDisposable);

    const moduleCodeLensSource = new ModuleCodeLensSource();
	const moduleCodeLensDisposable = vscode.languages.registerCodeLensProvider(moduleCodeLensSource.selector, moduleCodeLensSource);
    context.subscriptions.push(moduleCodeLensDisposable);

    context.subscriptions.push(buildBuildListener);
    context.subscriptions.push(formatNgModule);
}

export function deactivate() {
}