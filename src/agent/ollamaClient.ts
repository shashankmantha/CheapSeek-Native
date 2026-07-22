import { OllamaChatResponse } from '../types';

export async function askOllama(
	endpoint: string,
	model: string,
	prompt: string
): Promise<string> {
	let response: Response;

	try {
		response = await fetch(endpoint, {
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
	} catch (error) {
		throw new Error(
			`Failed to reach Ollama at ${endpoint} using model "${model}". ` +
			`Ollama may be stopped, the model may have failed to load, or the request may have been closed. ` +
			`${error instanceof Error ? error.message : String(error)}`
		);
	}

	if (!response.ok) {
		const errorBody = await response.text().catch(() => '');

		throw new Error(
			`Ollama request failed for model "${model}": ${response.status} ${response.statusText}` +
			(errorBody ? `\n\n${errorBody}` : '')
		);
	}

	const data = await response.json() as OllamaChatResponse;

	if (!data.message?.content) {
		throw new Error(`Ollama response from model "${model}" did not include message.content.`);
	}

	return data.message.content;
}