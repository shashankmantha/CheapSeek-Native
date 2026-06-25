import * as vscode from 'vscode';

import { FilePayload } from '../types';
import { createFilePayload } from './filePayload';

const DEFAULT_EXCLUDE_PATTERN =
	'**/{node_modules,dist,out,build,.git,.gradle,.idea,.vscode,bin,obj,target,coverage}/**';

const DEFAULT_INCLUDE_PATTERN =
	'**/*.{ts,tsx,js,jsx,json,md,py,java,cs,cpp,c,h,html,css,scss,go,rs,php,rb,yml,yaml,toml}';

export async function createWorkspacePayloads(
	maxFiles: number,
	maxCharsPerFile: number,
	maxTotalChars: number
): Promise<FilePayload[]> {
	const workspaceFolders = vscode.workspace.workspaceFolders;

	if (!workspaceFolders || workspaceFolders.length === 0) {
		vscode.window.showInformationMessage('No workspace folder is open.');
		return [];
	}

	const files = await vscode.workspace.findFiles(
		DEFAULT_INCLUDE_PATTERN,
		DEFAULT_EXCLUDE_PATTERN,
		maxFiles * 3
	);

	const payloads: FilePayload[] = [];
	let totalChars = 0;

	for (const file of files) {
		if (payloads.length >= maxFiles) {
			break;
		}

		try {
			const document = await vscode.workspace.openTextDocument(file);
			const payload = createFilePayload(document, maxCharsPerFile);

			if (payload.text.trim().length === 0) {
				continue;
			}

			if (totalChars + payload.charCount > maxTotalChars) {
				break;
			}

			payloads.push(payload);
			totalChars += payload.charCount;
		} catch (error) {
			console.error(`CheapSeek failed to open workspace file: ${file.fsPath}`, error);
		}
	}

	return payloads;
}

export function getWorkspaceRootName(): string {
	const workspaceFolders = vscode.workspace.workspaceFolders;

	if (!workspaceFolders || workspaceFolders.length === 0) {
		return 'No workspace folder';
	}

	if (workspaceFolders.length === 1) {
		return workspaceFolders[0].name;
	}

	return workspaceFolders.map(folder => folder.name).join(', ');
}