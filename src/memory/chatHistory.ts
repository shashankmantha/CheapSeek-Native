import * as vscode from 'vscode';

const CHAT_HISTORY_KEY = 'cheapseek.chatHistory';
const MAX_CHAT_TURNS = 10;

export interface ChatTurn {
	scope: 'file' | 'workspace' | 'selection';
	question: string;
	answer: string;
	file?: string;
	createdAt: string;
}

export function getChatHistory(
	context: vscode.ExtensionContext
): ChatTurn[] {
	return context.workspaceState.get<ChatTurn[]>(CHAT_HISTORY_KEY, []);
}

export async function addChatTurn(
	context: vscode.ExtensionContext,
	turn: Omit<ChatTurn, 'createdAt'>
): Promise<void> {
	const history = getChatHistory(context);

	const nextHistory: ChatTurn[] = [
		...history,
		{
			...turn,
			createdAt: new Date().toISOString(),
		},
	].slice(-MAX_CHAT_TURNS);

	await context.workspaceState.update(CHAT_HISTORY_KEY, nextHistory);
}

export async function clearChatHistory(
	context: vscode.ExtensionContext
): Promise<void> {
	await context.workspaceState.update(CHAT_HISTORY_KEY, []);
}

export function formatChatHistoryForPrompt(history: ChatTurn[]): string {
	if (history.length === 0) {
		return 'No previous CheapSeek chat history.';
	}

	return history
		.map((turn, index) => {
			return `
Turn ${index + 1}
Scope: ${turn.scope}
File: ${turn.file ?? 'N/A'}
Question: ${turn.question}
Answer: ${turn.answer}
`.trim();
		})
		.join('\n\n');
}