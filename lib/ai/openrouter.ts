export interface AICompletionOptions {
  model?: string;
  systemPrompt?: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export async function getAICompletion(options: AICompletionOptions): Promise<AIResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not defined');
  }

  const defaultModel = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-opus';
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Chabad Mafteach',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model || defaultModel,
      messages: [
        ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
        ...options.messages,
      ],
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to get AI completion');
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    model: data.model,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    },
  };
}
