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

Do not reveal hidden reasoning or step-by-step internal thinking.
Give the final answer directly.
Be concise unless the user asks for detail.

Use the recent CheapSeek chat history as conversational context.
Prioritize the current code context if chat history conflicts with the code.

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