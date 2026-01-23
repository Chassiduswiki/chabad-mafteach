export const DEFAULT_AI_MODEL = 'allenai/olmo-3.1-32b-think';

export const AI_CONFIG = {
  model: DEFAULT_AI_MODEL,
  apiKey: process.env.OPENROUTER_API_KEY,
  baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
} as const;
