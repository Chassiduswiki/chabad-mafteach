export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(
    messages: OpenRouterMessage[],
    model = 'deepseek/deepseek-r1', // Free DeepSeek model, excellent for reasoning
    options: {
      temperature?: number;
      max_tokens?: number;
      response_format?: { type: 'json_object' };
    } = {}
  ): Promise<OpenRouterResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://beta.chassiduswiki.com',
        'X-Title': 'Chabad Research Platform',
      },
      body: JSON.stringify({
        model,
        messages,
        ...options,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  // Helper method for structured JSON responses
  async chatJson<T>(
    prompt: string,
    schema: any, // JSON schema for validation
    model = 'deepseek/deepseek-r1'
  ): Promise<T> {
    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: `You are a helpful AI assistant. Always respond with valid JSON that matches this schema: ${JSON.stringify(schema)}`
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await this.chat(messages, model, {
      response_format: { type: 'json_object' },
      temperature: 0.1, // Low temperature for consistent structured output
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenRouter');
    }

    try {
      return JSON.parse(content) as T;
    } catch (e) {
      throw new Error(`Invalid JSON response: ${content}`);
    }
  }
}

// Default client instance (API key should be set in environment)
let defaultClient: OpenRouterClient | null = null;

export function getOpenRouterClient(): OpenRouterClient {
  if (!defaultClient) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }
    defaultClient = new OpenRouterClient(apiKey);
  }
  return defaultClient;
}
