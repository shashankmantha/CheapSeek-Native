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

		panel.webview.html = getChatWebviewHtml();

		setTimeout(postCurrentContext, 100);


			panel.webview.onDidReceiveMessage(
				async (message) => {

					if (message.command === 'refreshContext') {
						postCurrentContext();
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

						const payload = createFilePayload(document, maxCharsPerFile);
						const prompt = buildCurrentFilePrompt(payload, question);

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
		openChatCommand,
		askCurrentFileCommand,
		clearOutputCommand,
		activeEditorListener,
		documentChangeListener,
		output
	);
}

export function deactivate() {}

function getActiveDocument(
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

function getWorkspaceName(document: vscode.TextDocument): string {
	const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);

	if (workspaceFolder) {
		return workspaceFolder.name;
	}

	return 'No workspace folder';
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

function getChatWebviewHtml(): string {
	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>CheapSeek</title>
	<style>
		body {
			font-family: var(--vscode-font-family);
			color: var(--vscode-foreground);
			background-color: var(--vscode-editor-background);
			padding: 20px;
		}

		h1 {
			font-size: 22px;
			margin-bottom: 4px;
		}

		.subtitle {
			color: var(--vscode-descriptionForeground);
			margin-bottom: 20px;
		}

		.card {
			border: 1px solid var(--vscode-panel-border);
			background-color: var(--vscode-editorWidget-background);
			border-radius: 8px;
			padding: 16px;
			margin-bottom: 16px;
		}

		label {
			display: block;
			margin-bottom: 8px;
			font-weight: 600;
		}

		textarea {
			width: 100%;
			min-height: 90px;
			resize: vertical;
			box-sizing: border-box;
			padding: 10px;
			color: var(--vscode-input-foreground);
			background-color: var(--vscode-input-background);
			border: 1px solid var(--vscode-input-border);
			border-radius: 4px;
			font-family: var(--vscode-font-family);
		}

		.actions {
			display: flex;
			gap: 8px;
			margin-top: 12px;
		}

		button {
			color: var(--vscode-button-foreground);
			background-color: var(--vscode-button-background);
			border: none;
			border-radius: 4px;
			padding: 8px 12px;
			cursor: pointer;
		}

		button:hover {
			background-color: var(--vscode-button-hoverBackground);
		}

		button.secondary {
			color: var(--vscode-button-secondaryForeground);
			background-color: var(--vscode-button-secondaryBackground);
		}

		button.secondary:hover {
			background-color: var(--vscode-button-secondaryHoverBackground);
		}

		.meta {
			font-size: 12px;
			color: var(--vscode-descriptionForeground);
			margin-bottom: 12px;
		}

		.status {
			color: var(--vscode-descriptionForeground);
			margin-bottom: 12px;
		}

		pre {
			white-space: pre-wrap;
			word-wrap: break-word;
			background-color: var(--vscode-textCodeBlock-background);
			padding: 12px;
			border-radius: 6px;
			line-height: 1.5;
		}

		.context-card {
			font-size: 13px;
			color: var(--vscode-descriptionForeground);
		}

		.context-title {
			font-weight: 700;
			color: var(--vscode-foreground);
			margin-bottom: 8px;
		}

		.context-card div {
			margin-bottom: 4px;
		}

		.error {
			color: var(--vscode-errorForeground);
		}

		.context-help {
			margin-top: 8px;
			font-size: 12px;
			color: var(--vscode-descriptionForeground);
			font-style: italic;
		}

	</style>
</head>
<body>
	<h1>CheapSeek</h1>
		<div class="subtitle">Local code assistant powered by Ollama.</div>

		<div class="card context-card">
			<div class="context-title">Current Context</div>
			<div id="workspaceContext">Workspace: Not loaded yet</div>
			<div id="fileContext">File: Not loaded yet</div>
			<div id="modelContext">Model: Not loaded yet</div>

			<div class="context-help">
				If the file shown here does not match your current editor tab, click Refresh Context.
			</div>
			
			<div class="actions">
				<button id="refreshContextButton" class="secondary">Refresh Context</button>
			</div>
		</div>

	<div class="card">
		<label for="question">Ask about the current file</label>
		<textarea id="question" placeholder="Example: What does this file do?"></textarea>

		<div class="actions">
			<button id="askButton">Ask Current File</button>
			<button id="clearButton" class="secondary">Clear</button>
		</div>
	</div>

	<div class="card">
		<div id="status" class="status">Ready.</div>
		<div id="meta" class="meta"></div>
		<pre id="answer">Ask a question to get started.</pre>
	</div>

	<script>
		const vscode = acquireVsCodeApi();

		const question = document.getElementById('question');
		const askButton = document.getElementById('askButton');
		const clearButton = document.getElementById('clearButton');
		const status = document.getElementById('status');
		const meta = document.getElementById('meta');
		const answer = document.getElementById('answer');
		const workspaceContext = document.getElementById('workspaceContext');
		const fileContext = document.getElementById('fileContext');
		const modelContext = document.getElementById('modelContext');
		const refreshContextButton = document.getElementById('refreshContextButton');

		clearButton.addEventListener('click', () => {

			question.value = '';
			status.textContent = 'Ready.';
			status.className = 'status';
			meta.textContent = '';
			answer.textContent = 'Ask a question to get started.';

			workspaceContext.textContent = 'Workspace: Not loaded yet';
			fileContext.textContent = 'File: Not loaded yet';
			modelContext.textContent = 'Model: Not loaded yet';

			vscode.postMessage({
				command: 'clear',
			});
		});

		refreshContextButton.addEventListener('click', () => {
			status.textContent = 'Refreshing context...';
			status.className = 'status';

			vscode.postMessage({
				command: 'refreshContext',
			});
		});

		askButton.addEventListener('click', () => {
			const text = question.value.trim();

			if (!text) {
				status.textContent = 'Enter a question first.';
				status.className = 'status error';
				return;
			}

			status.textContent = 'Thinking locally...';
			status.className = 'status';
			meta.textContent = '';
			answer.textContent = 'Thinking locally...';

			vscode.postMessage({
				command: 'askCurrentFile',
				question: text,
			});
		});


		window.addEventListener('message', event => {
			const message = event.data;

			if (message.command === 'context') {
				workspaceContext.textContent = 'Workspace: ' + (message.workspace || 'Unknown');
				fileContext.textContent = 'File: ' + (message.file || 'Unknown');
				modelContext.textContent = 'Model: ' + (message.model || 'Unknown');

				status.textContent = 'Ready.';
				status.className = 'status';
			}

			if (message.command === 'thinking') {

				status.textContent = message.text;
				status.className = 'status';
				meta.textContent = '';

				workspaceContext.textContent = 'Workspace: ' + (message.workspace || 'Unknown');
				fileContext.textContent = 'File: ' + (message.file || 'Unknown');
				modelContext.textContent = 'Model: ' + (message.model || 'Unknown');

				answer.textContent = 'Thinking locally...';
			}

			if (message.command === 'answer') {
				status.textContent = 'Done.';
				status.className = 'status';

				workspaceContext.textContent = 'Workspace: ' + (message.workspace || 'Unknown');
				fileContext.textContent = 'File: ' + (message.file || 'Unknown');
				modelContext.textContent = 'Model: ' + (message.model || 'Unknown');

				meta.textContent = 'Question: ' + message.question;
				answer.textContent = message.text;
			}

			if (message.command === 'error') {
				status.textContent = 'Error.';
				status.className = 'status error';
				answer.textContent = message.text;
			}

			if (message.command === 'clear') {

				status.textContent = 'Ready.';
				status.className = 'status';
				meta.textContent = '';
				answer.textContent = 'Ask a question to get started.';

				workspaceContext.textContent = 'Workspace: Not loaded yet';
				fileContext.textContent = 'File: Not loaded yet';
				modelContext.textContent = 'Model: Not loaded yet';
			}
				
		});
	</script>
</body>
</html>
`;
}