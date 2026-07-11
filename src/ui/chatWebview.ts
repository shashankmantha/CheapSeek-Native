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
			flex-wrap: wrap;
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

		.mode-row {
			display: flex;
			align-items: center;
			gap: 12px;
			margin-bottom: 12px;
			flex-wrap: wrap;
		}

		.mode-label {
			font-size: 12px;
			text-transform: uppercase;
			letter-spacing: 0.06em;
			color: var(--vscode-descriptionForeground);
		}

		.mode-option {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 13px;
			color: var(--vscode-foreground);
			cursor: pointer;
			font-weight: 400;
			margin-bottom: 0;
		}

		.mode-option input {
			margin: 0;
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

		.history-header {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			gap: 12px;
			margin-bottom: 12px;
		}

		.history-subtitle {
			font-size: 12px;
			color: var(--vscode-descriptionForeground);
			margin-top: 2px;
		}

		.history-list {
			max-height: 360px;
			overflow-y: auto;
			border: 1px solid var(--vscode-panel-border);
			border-radius: 6px;
			padding: 10px;
			background-color: var(--vscode-editor-background);
		}

		.history-empty {
			color: var(--vscode-descriptionForeground);
			font-style: italic;
			font-size: 13px;
		}

		.history-item {
			border-bottom: 1px solid var(--vscode-panel-border);
			padding: 10px 0;
		}

		.history-item:last-child {
			border-bottom: none;
		}

		.history-meta {
			font-size: 12px;
			color: var(--vscode-descriptionForeground);
			margin-bottom: 6px;
		}

		.history-question {
			font-weight: 700;
			margin-bottom: 6px;
		}

		.history-answer {
			white-space: pre-wrap;
			word-wrap: break-word;
			font-size: 13px;
			line-height: 1.45;
			color: var(--vscode-foreground);
			background-color: var(--vscode-textCodeBlock-background);
			padding: 8px;
			border-radius: 4px;
			max-height: 180px;
			overflow-y: auto;
		}

		.chat-select {
			width: 100%;
			box-sizing: border-box;
			padding: 8px;
			color: var(--vscode-dropdown-foreground);
			background-color: var(--vscode-dropdown-background);
			border: 1px solid var(--vscode-dropdown-border);
			border-radius: 4px;
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
		<div class="mode-row">
			<span class="mode-label">Context</span>

			<label class="mode-option">
				<input type="radio" name="askMode" value="file" checked />
				Current File
			</label>

			<label class="mode-option">
				<input type="radio" name="askMode" value="workspace" />
				Workspace
			</label>
		</div>


		<div class="card">
			<div class="history-header">
				<div>
					<div class="context-title">Chats</div>
					<div class="history-subtitle">Start fresh when context gets too large.</div>
				</div>

				<button id="newChatButton" class="secondary">New Chat</button>
			</div>

			<select id="chatSessionSelect" class="chat-select">
				<option value="">Loading chats...</option>
			</select>
		</div>

		<label for="question">Ask CheapSeek</label>
		<textarea id="question" placeholder="Example: What does this file do?"></textarea>

		<div class="actions">
			<button id="askButton">Ask CheapSeek</button>
			<button id="clearButton" class="secondary">Clear</button>
		</div>
	</div>

	<div class="card">
		<div id="status" class="status">Ready.</div>
		<div id="meta" class="meta"></div>
		<pre id="answer">Ask a question to get started.</pre>
	</div>

	<div class="card">
		<div class="history-header">
			<div>
				<div class="context-title">Chat History</div>
				<div class="history-subtitle">Previous CheapSeek questions and replies for this workspace.</div>
			</div>

			<button id="refreshHistoryButton" class="secondary">Refresh History</button>
			
		</div>

		<div id="historyList" class="history-list">
			<div class="history-empty">No previous chats yet.</div>
		</div>
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
		const historyList = document.getElementById('historyList');
		const refreshHistoryButton = document.getElementById('refreshHistoryButton');
		const newChatButton = document.getElementById('newChatButton');
		const chatSessionSelect = document.getElementById('chatSessionSelect');

		function getSelectedMode() {
			const selectedInput = document.querySelector('input[name="askMode"]:checked');
			return selectedInput ? selectedInput.value : 'file';
		}

		function updatePlaceholderForMode() {
			const selectedMode = getSelectedMode();

			question.placeholder = selectedMode === 'workspace'
				? 'Example: What does this project do?'
				: 'Example: What does this file do?';
		}

		function clearElement(element) {
			while (element.firstChild) {
				element.removeChild(element.firstChild);
			}
		}

		function renderHistory(history) {
			clearElement(historyList);

			if (!Array.isArray(history) || history.length === 0) {
				const empty = document.createElement('div');
				empty.className = 'history-empty';
				empty.textContent = 'No previous chats yet.';
				historyList.appendChild(empty);
				return;
			}

			const reversedHistory = history.slice().reverse();

			reversedHistory.forEach((turn) => {
				const item = document.createElement('div');
				item.className = 'history-item';

				const createdAt = turn.createdAt
					? new Date(turn.createdAt).toLocaleString()
					: 'Unknown time';

				const scope = turn.scope || 'unknown';
				const file = turn.file || 'N/A';

				const historyMeta = document.createElement('div');
				historyMeta.className = 'history-meta';
				historyMeta.textContent = scope + ' - ' + file + ' - ' + createdAt;

				const historyQuestion = document.createElement('div');
				historyQuestion.className = 'history-question';
				historyQuestion.textContent = 'Q: ' + (turn.question || '');

				const historyAnswer = document.createElement('div');
				historyAnswer.className = 'history-answer';
				historyAnswer.textContent = turn.answer || '';

				item.appendChild(historyMeta);
				item.appendChild(historyQuestion);
				item.appendChild(historyAnswer);

				historyList.appendChild(item);
			});
		}

		function renderChatSessions(sessions, activeSessionId) {
			clearElement(chatSessionSelect);

			if (!Array.isArray(sessions) || sessions.length === 0) {
				const option = document.createElement('option');
				option.value = '';
				option.textContent = 'No chats yet';
				chatSessionSelect.appendChild(option);
				return;
			}

			sessions.slice().reverse().forEach((session) => {
				const option = document.createElement('option');
				option.value = session.id;

				const turnCount = Array.isArray(session.turns) ? session.turns.length : 0;
				option.textContent = session.title + ' (' + turnCount + ')';

				if (session.id === activeSessionId) {
					option.selected = true;
				}

				chatSessionSelect.appendChild(option);
			});
		}

		document.querySelectorAll('input[name="askMode"]').forEach((input) => {
			input.addEventListener('change', updatePlaceholderForMode);
		});

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

		refreshHistoryButton.addEventListener('click', () => {
			vscode.postMessage({
				command: 'refreshHistory',
			});
		});

		newChatButton.addEventListener('click', () => {
			vscode.postMessage({
				command: 'newChatSession',
			});
		});

		chatSessionSelect.addEventListener('change', () => {
			const sessionId = chatSessionSelect.value;

			if (!sessionId) {
				return;
			}

			vscode.postMessage({
				command: 'switchChatSession',
				sessionId,
			});
		});

		askButton.addEventListener('click', () => {
			const text = question.value.trim();

			if (!text) {
				status.textContent = 'Enter a question first.';
				status.className = 'status error';
				return;
			}

			const selectedMode = getSelectedMode();
			const command = selectedMode === 'workspace' ? 'askWorkspace' : 'askCurrentFile';

			status.textContent = selectedMode === 'workspace'
				? 'Collecting workspace context...'
				: 'Thinking locally...';

			status.className = 'status';
			meta.textContent = '';

			answer.textContent = selectedMode === 'workspace'
				? 'Collecting workspace context and thinking locally...'
				: 'Thinking locally...';

			vscode.postMessage({
				command,
				question: text,
			});
		});

		window.addEventListener('message', event => {
			const message = event.data;

			if (message.command === 'chatSessions') {
				renderChatSessions(message.sessions, message.activeSessionId);
			}

			if (message.command === 'clearAnswerOnly') {
				status.textContent = 'Ready.';
				status.className = 'status';
				meta.textContent = '';
				answer.textContent = 'Ask a question to get started.';
			}

			if (message.command === 'history') {
				renderHistory(message.history);
			}

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

				answer.textContent = message.text || 'Thinking locally...';
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

		updatePlaceholderForMode();
	</script>
</body>
</html>
`;
}