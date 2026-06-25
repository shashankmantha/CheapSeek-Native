import * as vscode from 'vscode';
import { FilePayload } from '../types';

export function createFilePayload(
	document: vscode.TextDocument,
	maxCharsPerFile: number
): FilePayload {
	const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);

	const relativePath = workspaceFolder
		? vscode.workspace.asRelativePath(document.uri, false)
		: document.fileName;

	const fileName = document.fileName.split(/[\\/]/).pop() ?? document.fileName;

	const fullText = document.getText();
	const text = fullText.length > maxCharsPerFile
		? fullText.slice(0, maxCharsPerFile) + '\n\n// [CheapSeek truncated this file due to size limits]'
		: fullText;

	return {
		uri: document.uri,
		fileName,
		relativePath,
		languageId: document.languageId,
		text,
		lineCount: document.lineCount,
		charCount: text.length,
	};
}