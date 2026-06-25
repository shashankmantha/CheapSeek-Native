import { OllamaChatResponse } from '../types';

export async function askOllama(
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