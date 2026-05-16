import * as vscode from 'vscode';

interface FilePayload {
	uri: vscode.Uri;
	fileName: string;
	relativePath: string;
	languageId: string;
	text: string;
	lineCount: number;
	charCount: number;
}

interface OllamaChatResponse {
	message?: {
		content?: string;
	};
}


export function activate(context: vscode.ExtensionContext) {
	console.log('CheapSeek extension is now active');

	const output = vscode.window.createOutputChannel('CheapSeek');

	const askCurrentFileCommand = vscode.commands.registerCommand(
		'cheapseek.askCurrentFile',
		async () => {
			const document = getActiveDocument();

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

			const payload = createFilePayload(document, maxCharsPerFile);
			const prompt = buildCurrentFilePrompt(payload, question);

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
		askCurrentFileCommand,
		clearOutputCommand,
		output
	);
}

export function deactivate() {}

function getActiveDocument(): vscode.TextDocument | undefined {
	const editor = vscode.window.activeTextEditor;
	return editor?.document;
}

function createFilePayload(
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

function buildCurrentFilePrompt(file: FilePayload, question: string): string {
	return `
You are CheapSeek, a local code assistant running inside VS Code.

Answer the user's question using only the code context below.
Be specific.
Reference file names, functions, and line numbers when useful.
If the answer is not knowable from the provided code, say so.

User question:
${question}

File:
${file.relativePath}

Language:
${file.languageId}

Code:
\`\`\`${file.languageId}
${file.text}
\`\`\`
`.trim();
}

async function askOllama(
	endpoint: string,
	model: string,
	prompt: string
): Promise<string> {
	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			model,
			stream: false,
			messages: [
				{
					role: 'user',
					content: prompt,
				},
			],
		}),
	});

	if (!response.ok) {
		throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
	}

	const data = await response.json() as OllamaChatResponse;

	if (!data.message?.content) {
		throw new Error('Ollama response did not include message.content.');
	}

	return data.message.content;
}