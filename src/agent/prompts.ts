import { FilePayload } from '../types';

export function buildCurrentFilePrompt(
	file: FilePayload,
	question: string,
	chatHistoryText: string
): string {
	return `
You are CheapSeek, a local code assistant running inside VS Code.

Use the recent CheapSeek chat history as conversational context.
Prioritize the current code context if chat history conflicts with the code.

Recent CheapSeek chat history:
${chatHistoryText}

Current user question:
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

export function buildWorkspacePrompt(
	files: FilePayload[],
	question: string,
	chatHistoryText: string
): string {
	const fileBlocks = files
		.map((file) => {
			return `
--- FILE: ${file.relativePath} ---
Language: ${file.languageId}
Lines: ${file.lineCount}
Chars included: ${file.charCount}

\`\`\`${file.languageId}
${file.text}
\`\`\`
`.trim();
		})
		.join('\n\n');

	return `
You are CheapSeek, a local code assistant running inside VS Code.

Answer the user's question using only the workspace code context below.
Use the recent CheapSeek chat history as conversational context.
Prioritize the workspace code context if chat history conflicts with the code.
Be specific.
Reference file names and functions when useful.
If the answer is not knowable from the provided workspace context, say so.
The workspace context may be partial because CheapSeek applies local context limits.

Recent CheapSeek chat history:
${chatHistoryText}

Current user question:
${question}

Workspace files included:
${files.map(file => `- ${file.relativePath}`).join('\n')}

Code context:
${fileBlocks}
`.trim();
}