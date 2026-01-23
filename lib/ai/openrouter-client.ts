// lib/ai/openrouter-client.ts
import { DEFAULT_AI_MODEL } from './config';

interface TranslationQuality {
  score: number;
  explanation: string;
}

interface TranslationResult {
  translation: string;
  quality: TranslationQuality;
  model: string;
  isFallback: boolean;
}

interface AISettings {
  provider: string;
  api_key: string;
  primary_model: string;
  fallback_model: string;
  quality_threshold: number;
  auto_approval_threshold: number;
}

class OpenRouterClient {
  private apiKey: string;
  private primaryModel: string;
  private fallbackModel: string;
  private settingsLoaded: boolean = false;

  constructor() {
    // Initialize with empty values - will be loaded dynamically
    this.apiKey = '';
    this.primaryModel = '';
    this.fallbackModel = '';
  }

  private async loadSettings(): Promise<void> {
    if (this.settingsLoaded) return;

    try {
      const response = await fetch('/api/ai/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch AI settings');
      }

      const settings: AISettings = await response.json();
      this.apiKey = settings.api_key || process.env.OPENROUTER_API_KEY || '';
      this.primaryModel = settings.primary_model || DEFAULT_AI_MODEL;
      this.fallbackModel = settings.fallback_model || 'anthropic/claude-3.5-sonnet';
      this.settingsLoaded = true;

      if (!this.apiKey) {
        throw new Error('API key is required. Please configure it in AI Settings.');
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
      throw new Error('Failed to load AI settings. Please configure them in the admin panel.');
    }
  }

  private getChassidicPrompt(text: string, sourceLang: string, targetLang: string, context?: string): string {
    return `
      Translate the following text from ${sourceLang} to ${targetLang}. 
      The text is from Chassidic literature, so please use appropriate mystical and philosophical terminology.
      ${context ? `Context: ${context}` : ''}

      Text to translate: "${text}"

      Respond with a JSON object containing two keys: 'translation' (the translated text) and 'quality' (an object with 'score' from 0.0 to 1.0 for translation quality and a brief 'explanation').
    `;
  }

  async translate(text: string, sourceLang: string, targetLang: string, context?: string): Promise<TranslationResult> {
    // Load settings dynamically before making requests
    await this.loadSettings();

    let model = this.primaryModel;
    let isFallback = false;

    try {
      return await this.sendRequest(text, sourceLang, targetLang, model, context);
    } catch (error) {
      console.warn(`Primary model (${this.primaryModel}) failed. Retrying with fallback model (${this.fallbackModel}).`, error);
      isFallback = true;
      model = this.fallbackModel;
      try {
        const result = await this.sendRequest(text, sourceLang, targetLang, model, context);
        return { ...result, isFallback };
      } catch (fallbackError) {
        console.error(`Fallback model (${this.fallbackModel}) also failed.`, fallbackError);
        throw new Error('Both primary and fallback models failed to provide a translation.');
      }
    }
  }

  private async sendRequest(text: string, sourceLang: string, targetLang: string, model: string, context?: string): Promise<TranslationResult> {
    const prompt = this.getChassidicPrompt(text, sourceLang, targetLang, context);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);

    return {
      translation: content.translation,
      quality: content.quality,
      model: model,
      isFallback: false, // This will be adjusted in the main translate method if needed
    };

  }
}

export default OpenRouterClient;
