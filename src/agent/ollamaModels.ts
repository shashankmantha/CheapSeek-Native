export interface OllamaModelInfo {
	name: string;
	model?: string;
	modified_at?: string;
	size?: number;
	digest?: string;
	details?: {
		parent_model?: string;
		format?: string;
		family?: string;
		families?: string[];
		parameter_size?: string;
		quantization_level?: string;
	};
}

interface OllamaTagsResponse {
	models?: OllamaModelInfo[];
}

export function getOllamaBaseUrl(endpoint: string): string {
	if (endpoint.endsWith('/api/chat')) {
		return endpoint.slice(0, -'/api/chat'.length);
	}

	return endpoint.replace(/\/$/, '');
}

export async function listOllamaModels(endpoint: string): Promise<OllamaModelInfo[]> {
	const baseUrl = getOllamaBaseUrl(endpoint);
	const response = await fetch(`${baseUrl}/api/tags`);

	if (!response.ok) {
		throw new Error(`Failed to list Ollama models: ${response.status} ${response.statusText}`);
	}

	const data = await response.json() as OllamaTagsResponse;

	return data.models ?? [];
}