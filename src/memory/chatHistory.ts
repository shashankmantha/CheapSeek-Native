import * as vscode from 'vscode';

const CHAT_SESSIONS_KEY = 'cheapseek.chatSessions';
const ACTIVE_CHAT_SESSION_ID_KEY = 'cheapseek.activeChatSessionId';
const MAX_CHAT_TURNS_PER_SESSION = 10;

export interface ChatTurn {
	scope: 'file' | 'workspace' | 'selection';
	question: string;
	answer: string;
	file?: string;
	createdAt: string;
}

export interface ChatSession {
	id: string;
	title: string;
	turns: ChatTurn[];
	createdAt: string;
	updatedAt: string;
}

function createSessionId(): string {
	return 'chat-' + Date.now().toString() + '-' + Math.random().toString(16).slice(2);
}

function createDefaultSession(): ChatSession {
	const now = new Date().toISOString();

	return {
		id: createSessionId(),
		title: 'New Chat',
		turns: [],
		createdAt: now,
		updatedAt: now,
	};
}

function createTitleFromQuestion(question: string): string {
	const cleanQuestion = question.trim().replace(/\s+/g, ' ');

	if (!cleanQuestion) {
		return 'New Chat';
	}

	if (cleanQuestion.length <= 40) {
		return cleanQuestion;
	}

	return cleanQuestion.slice(0, 40) + '...';
}

export function getChatSessions(
	context: vscode.ExtensionContext
): ChatSession[] {
	return context.workspaceState.get<ChatSession[]>(CHAT_SESSIONS_KEY, []);
}

export async function saveChatSessions(
	context: vscode.ExtensionContext,
	sessions: ChatSession[]
): Promise<void> {
	await context.workspaceState.update(CHAT_SESSIONS_KEY, sessions);
}

export function getActiveChatSessionId(
	context: vscode.ExtensionContext
): string | undefined {
	return context.workspaceState.get<string>(ACTIVE_CHAT_SESSION_ID_KEY);
}

export async function setActiveChatSessionId(
	context: vscode.ExtensionContext,
	sessionId: string
): Promise<void> {
	await context.workspaceState.update(ACTIVE_CHAT_SESSION_ID_KEY, sessionId);
}

export async function ensureActiveChatSession(
	context: vscode.ExtensionContext
): Promise<ChatSession> {
	const sessions = getChatSessions(context);
	const activeSessionId = getActiveChatSessionId(context);

	const existingActiveSession = sessions.find((session) => session.id === activeSessionId);

	if (existingActiveSession) {
		return existingActiveSession;
	}

	const defaultSession = createDefaultSession();
	const nextSessions = [...sessions, defaultSession];

	await saveChatSessions(context, nextSessions);
	await setActiveChatSessionId(context, defaultSession.id);

	return defaultSession;
}

export async function createNewChatSession(
	context: vscode.ExtensionContext
): Promise<ChatSession> {
	const sessions = getChatSessions(context);
	const newSession = createDefaultSession();

	await saveChatSessions(context, [...sessions, newSession]);
	await setActiveChatSessionId(context, newSession.id);

	return newSession;
}

export async function switchChatSession(
	context: vscode.ExtensionContext,
	sessionId: string
): Promise<ChatSession | undefined> {
	const sessions = getChatSessions(context);
	const session = sessions.find((item) => item.id === sessionId);

	if (!session) {
		return undefined;
	}

	await setActiveChatSessionId(context, session.id);

	return session;
}

export function getActiveChatSession(
	context: vscode.ExtensionContext
): ChatSession | undefined {
	const sessions = getChatSessions(context);
	const activeSessionId = getActiveChatSessionId(context);

	return sessions.find((session) => session.id === activeSessionId);
}

export function getChatHistory(
	context: vscode.ExtensionContext
): ChatTurn[] {
	const activeSession = getActiveChatSession(context);

	return activeSession?.turns ?? [];
}

export async function addChatTurn(
	context: vscode.ExtensionContext,
	turn: Omit<ChatTurn, 'createdAt'>
): Promise<void> {
	const activeSession = await ensureActiveChatSession(context);
	const sessions = getChatSessions(context);

	const newTurn: ChatTurn = {
		...turn,
		createdAt: new Date().toISOString(),
	};

	const nextSessions = sessions.map((session) => {
		if (session.id !== activeSession.id) {
			return session;
		}

		const nextTurns = [...session.turns, newTurn].slice(-MAX_CHAT_TURNS_PER_SESSION);

		return {
			...session,
			title: session.turns.length === 0 ? createTitleFromQuestion(turn.question) : session.title,
			turns: nextTurns,
			updatedAt: new Date().toISOString(),
		};
	});

	await saveChatSessions(context, nextSessions);
}

export async function clearChatHistory(
	context: vscode.ExtensionContext
): Promise<void> {
	const activeSession = await ensureActiveChatSession(context);
	const sessions = getChatSessions(context);

	const nextSessions = sessions.map((session) => {
		if (session.id !== activeSession.id) {
			return session;
		}

		return {
			...session,
			turns: [],
			title: 'New Chat',
			updatedAt: new Date().toISOString(),
		};
	});

	await saveChatSessions(context, nextSessions);
}

export function formatChatHistoryForPrompt(history: ChatTurn[]): string {
	if (history.length === 0) {
		return 'No previous CheapSeek chat history in this chat.';
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