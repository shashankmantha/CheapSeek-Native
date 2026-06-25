import * as vscode from 'vscode';

export function getActiveDocument(
	lastActiveTextEditor?: vscode.TextEditor
): vscode.TextDocument | undefined {
	const activeEditor = vscode.window.activeTextEditor;

	if (activeEditor && activeEditor.document.uri.scheme === 'file') {
		return activeEditor.document;
	}

	if (lastActiveTextEditor && lastActiveTextEditor.document.uri.scheme === 'file') {
		return lastActiveTextEditor.document;
	}

	return undefined;
}

export function getWorkspaceName(document: vscode.TextDocument): string {
	const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);

	if (workspaceFolder) {
		return workspaceFolder.name;
	}

	return 'No workspace folder';
}