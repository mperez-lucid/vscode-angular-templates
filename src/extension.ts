'use strict';
import * as vscode from 'vscode';
import * as angular from './angular';
import * as builder from './builder';
import * as unittests from './unittests';

export function activate(context: vscode.ExtensionContext) {
    angular.activate(context);
    unittests.activate(context);
    builder.activate(context);
}

export function deactivate() {
    angular.deactivate();
    unittests.deactivate();
    builder.deactivate();
}