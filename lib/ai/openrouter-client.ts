// lib/ai/openrouter-client.ts
import { DEFAULT_AI_MODEL } from './config';

export interface TranslationQuality {
  score: number;
  explanation: string;
}

export interface TranslationResult {
  translation: string;
  quality: TranslationQuality;
  model: string;
  isFallback: boolean;
}

export interface AISettings {
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

  constructor(settings: Partial<AISettings>) {
    this.apiKey = settings.api_key || process.env.OPENROUTER_API_KEY || '';
    this.primaryModel = settings.primary_model || DEFAULT_AI_MODEL;
    this.fallbackModel = settings.fallback_model || 'anthropic/claude-3.5-sonnet';
  }

  private getChassidicPrompt(text: string, sourceLang: string, targetLang: string, context?: string): string {
    return `
      You are a scholar of Chassidic philosophy and an expert translator specializing in Chabad terminology. 
      Translate the following text from ${sourceLang} to ${targetLang}. 
      
      CRITICAL INSTRUCTIONS:
      1. Use precise mystical and philosophical terminology (e.g., "Achdus Hashem", "Bittul", "Sovev Kol Almin", "Memale Kol Almin").
      2. Maintain the scholarly tone appropriate for Torah study.
      3. Preserve any HTML tags or Markdown formatting exactly.
      4. If the source contains Hebrew terms transliterated into English, ensure they are translated accurately into the target language's equivalent scholarly term or kept if it's a standard term.
      
      ${context ? `ADDITIONAL CONTEXT: ${context}` : ''}

      TEXT TO TRANSLATE:
      "${text}"

      RESPONSE FORMAT:
      You MUST respond with a valid JSON object only. No other text.
      Format: { "translation": "...", "quality": { "score": 0.0-1.0, "explanation": "..." } }
    `;
  }

  async translate(text: string, sourceLang: string, targetLang: string, context?: string): Promise<TranslationResult> {
    if (!this.apiKey) {
      throw new Error('API key is required for AI translation.');
    }

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
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Chabad Mafteach',
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2, // Keep it low for translation accuracy
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    let content;
    try {
      content = JSON.parse(data.choices[0].message.content);
    } catch (e) {
      // Handle cases where the model might return a string that is not valid JSON
      console.error('Failed to parse AI response as JSON:', data.choices[0].message.content);
      throw new Error('AI returned an invalid response format.');
    }

    return {
      translation: content.translation,
      quality: content.quality,
      model: model,
      isFallback: false,
    };
  }
}

export default OpenRouterClient;
