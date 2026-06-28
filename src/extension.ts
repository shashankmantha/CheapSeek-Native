import * as vscode from 'vscode';

import { askOllama } from './agent/ollamaClient';
import { buildCurrentFilePrompt, buildWorkspacePrompt } from './agent/prompts';
import { getActiveDocument, getWorkspaceName } from './documents/activeDocument';
import { createFilePayload } from './documents/filePayload';
import { createWorkspacePayloads, getWorkspaceRootName } from './documents/workspacePayload';
import { getChatWebviewHtml } from './ui/chatWebview';

import {
	addChatTurn,
	formatChatHistoryForPrompt,
	getChatHistory,
} from './memory/chatHistory';

export function activate(context: vscode.ExtensionContext) {
	console.log('CheapSeek extension is now active');

	const output = vscode.window.createOutputChannel('CheapSeek');

	let lastActiveTextEditor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;

	const activeEditorListener = vscode.window.onDidChangeActiveTextEditor((editor) => {
		if (editor && editor.document.uri.scheme === 'file') {
			lastActiveTextEditor = editor;
		}
	}); 

	const documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
		const activeEditor = vscode.window.activeTextEditor;

		if (
			activeEditor &&
			activeEditor.document.uri.toString() === event.document.uri.toString() &&
			event.document.uri.scheme === 'file'
		) {
			lastActiveTextEditor = activeEditor;
		}
	});

	const openChatCommand = vscode.commands.registerCommand(
		'cheapseek.openChat',
		async () => {
			const panel = vscode.window.createWebviewPanel(
				'cheapseekChat',
				'CheapSeek',
				vscode.ViewColumn.Beside,
				{
					enableScripts: true,
				}
			);

			const postCurrentContext = () => {
				const document = getActiveDocument(lastActiveTextEditor);
				const config = vscode.workspace.getConfiguration('cheapseek');
				const model = config.get<string>('modelName', 'deepseek-r1:7b');

				if (!document) {
					panel.webview.postMessage({
						command: 'context',
						workspace: 'No workspace detected',
						file: 'No file detected',
						model,
					});
					return;
				}

				panel.webview.postMessage({
					command: 'context',
					workspace: getWorkspaceName(document),
					file: vscode.workspace.asRelativePath(document.uri, false),
					model,
				});
			};

			const postChatHistory = () => {
				const history = getChatHistory(context);

				panel.webview.postMessage({
					command: 'history',
					history,
				});
			};

			panel.webview.html = getChatWebviewHtml();

			setTimeout(postCurrentContext, 100);

			setTimeout(postChatHistory, 150);

			panel.webview.onDidReceiveMessage(
				async (message) => {
					if (message.command === 'refreshContext') {
						postCurrentContext();
						return;
					}

					if (message.command === 'refreshHistory') {
						postChatHistory();
						return;
					}

					if (message.command === 'askCurrentFile') {
						const document = getActiveDocument(lastActiveTextEditor);

						if (!document) {
							panel.webview.postMessage({
								command: 'error',
								text: 'No active file open.',
							});
							return;
						}

						const question = String(message.question ?? '').trim();

						if (!question) {
							panel.webview.postMessage({
								command: 'error',
								text: 'Please enter a question.',
							});
							return;
						}

						const config = vscode.workspace.getConfiguration('cheapseek');
						const endpoint = config.get<string>('modelEndpoint', 'http://localhost:11434/api/chat');
						const model = config.get<string>('modelName', 'deepseek-r1:7b');
						const maxCharsPerFile = config.get<number>('maxCharsPerFile', 12000);

						const chatHistory = getChatHistory(context);
						const chatHistoryText = formatChatHistoryForPrompt(chatHistory);

						const payload = createFilePayload(document, maxCharsPerFile);
						const prompt = buildCurrentFilePrompt(payload, question, chatHistoryText);
						
						
						panel.webview.postMessage({
							command: 'thinking',
							text: `Thinking locally with ${model}...`,
							file: payload.relativePath,
							workspace: getWorkspaceName(document),
							model,
							question,
						});

						try {
							const answer = await askOllama(endpoint, model, prompt);

							await addChatTurn(context, {
								scope: 'file',
								question,
								answer,
								file: payload.relativePath,
							});

							postChatHistory();

							panel.webview.postMessage({
								command: 'answer',
								text: answer,
								file: payload.relativePath,
								workspace: getWorkspaceName(document),
								model,
								question,
							});
						} catch (error) {
							panel.webview.postMessage({
								command: 'error',
								text: error instanceof Error ? error.message : String(error),
							});
						}

						return;
					}

					if (message.command === 'askWorkspace') {
						const question = String(message.question ?? '').trim();

						if (!question) {
							panel.webview.postMessage({
								command: 'error',
								text: 'Please enter a question.',
							});
							return;
						}

						const config = vscode.workspace.getConfiguration('cheapseek');
						const endpoint = config.get<string>('modelEndpoint', 'http://localhost:11434/api/chat');
						const model = config.get<string>('modelName', 'deepseek-r1:7b');
						const maxCharsPerFile = config.get<number>('maxCharsPerFile', 12000);
						const maxWorkspaceFiles = config.get<number>('maxWorkspaceFiles', 20);
						const maxTotalWorkspaceChars = config.get<number>('maxTotalWorkspaceChars', 80000);

						panel.webview.postMessage({
							command: 'thinking',
							text: `Collecting workspace context and thinking locally with ${model}...`,
							file: `${maxWorkspaceFiles} file limit`,
							workspace: getWorkspaceRootName(),
							model,
							question,
						});

						try {
							const payloads = await createWorkspacePayloads(
								maxWorkspaceFiles,
								maxCharsPerFile,
								maxTotalWorkspaceChars
							);

							if (payloads.length === 0) {
								panel.webview.postMessage({
									command: 'error',
									text: 'No workspace files were found for CheapSeek to analyze.',
								});
								return;
							}


							const chatHistory = getChatHistory(context);
							const chatHistoryText = formatChatHistoryForPrompt(chatHistory);

							const prompt = buildWorkspacePrompt(payloads, question, chatHistoryText);
							const answer = await askOllama(endpoint, model, prompt);

							await addChatTurn(context, {
								scope: 'workspace',
								question,
								answer,
								file: `${payloads.length} files included`,
							});

							postChatHistory();

							panel.webview.postMessage({
								command: 'answer',
								text: answer,
								file: `${payloads.length} files included`,
								workspace: getWorkspaceRootName(),
								model,
								question,
							});
						} catch (error) {
							panel.webview.postMessage({
								command: 'error',
								text: error instanceof Error ? error.message : String(error),
							});
						}

						return;
					}

					if (message.command === 'clear') {
						panel.webview.postMessage({
							command: 'clear',
						});
					}
				},
				undefined,
				context.subscriptions
			);
		}
	);

	const askCurrentFileCommand = vscode.commands.registerCommand(
		'cheapseek.askCurrentFile',
		async () => {
			const document = getActiveDocument(lastActiveTextEditor);

			if (!document) {
				output.show(true);
				output.appendLine('No active file open.');
				return;
			}

			const question = await vscode.window.showInputBox({
				title: 'Ask CheapSeek about the current file',
				placeHolder: 'Example: What does this file do?',
				prompt: 'Ask a question about the current file.',
				ignoreFocusOut: true,
			});

			if (!question || question.trim().length === 0) {
				return;
			}

			const config = vscode.workspace.getConfiguration('cheapseek');
			const endpoint = config.get<string>('modelEndpoint', 'http://localhost:11434/api/chat');
			const model = config.get<string>('modelName', 'deepseek-r1:7b');
			const maxCharsPerFile = config.get<number>('maxCharsPerFile', 12000);


			const chatHistory = getChatHistory(context);
			const chatHistoryText = formatChatHistoryForPrompt(chatHistory);		

			const payload = createFilePayload(document, maxCharsPerFile);
			const prompt = buildCurrentFilePrompt(payload, question, chatHistoryText);

			output.clear();
			output.show(true);
			output.appendLine('--- CheapSeek ---');
			output.appendLine(`Model: ${model}`);
			output.appendLine(`File: ${payload.relativePath}`);
			output.appendLine(`Question: ${question}`);
			output.appendLine('--------------------------------');
			output.appendLine('Thinking locally...');
			output.appendLine('');

			try {
				const answer = await askOllama(endpoint, model, prompt);

				await addChatTurn(context, {
					scope: 'file',
					question,
					answer,
					file: payload.relativePath,
				});

			

				output.clear();
				output.show(true);
				output.appendLine('--- CheapSeek ---');
				output.appendLine(`Model: ${model}`);
				output.appendLine(`File: ${payload.relativePath}`);
				output.appendLine(`Question: ${question}`);
				output.appendLine('--------------------------------');
				output.appendLine(answer);
			} catch (error) {
				output.appendLine('');
				output.appendLine('CheapSeek failed to get a response from the local model.');
				output.appendLine('');
				output.appendLine(error instanceof Error ? error.message : String(error));

				vscode.window.showErrorMessage(
					'CheapSeek could not reach the local model. Is Ollama running?'
				);
			}
		}
	);

	const clearOutputCommand = vscode.commands.registerCommand(
		'cheapseek.clearOutput',
		async () => {
			output.clear();
			output.show(true);
			output.appendLine('CheapSeek output cleared.');
		}
	);

	context.subscriptions.push(
		openChatCommand,
		askCurrentFileCommand,
		clearOutputCommand,
		activeEditorListener,
		documentChangeListener,
		output
	);
}

export function deactivate() {}