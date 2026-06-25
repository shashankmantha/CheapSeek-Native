import * as vscode from 'vscode';

export interface FilePayload {
	uri: vscode.Uri;
	fileName: string;
	relativePath: string;
	languageId: string;
	text: string;
	lineCount: number;
	charCount: number;
}

export interface OllamaChatResponse {
	message?: {
		content?: string;
	};
}