export function getChatWebviewHtml(): string {
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