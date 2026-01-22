import OpenRouterClient from './openrouter-client';
import { DEFAULT_AI_MODEL } from './config';

export interface AIAssistantOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class AIAssistant {
  private client: OpenRouterClient;

  constructor() {
    this.client = new OpenRouterClient();
  }

  /**
   * Generate content based on a prompt
   */
  async generateContent(prompt: string, options?: AIAssistantOptions): Promise<string> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options?.model || DEFAULT_AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Expand a brief topic description into a comprehensive article
   */
  async expandTopicArticle(topicTitle: string, briefDescription: string): Promise<string> {
    const prompt = `You are a Chassidic scholar writing educational content. 
    
Topic: ${topicTitle}
Brief Description: ${briefDescription}

Please expand this into a comprehensive, well-structured article about this Chassidic concept. Include:
1. A clear introduction explaining the concept
2. Deeper philosophical insights
3. Practical applications for daily life
4. Relevant connections to other Chassidic teachings

Write in a clear, accessible style while maintaining scholarly depth. Use markdown formatting.`;

    return this.generateContent(prompt);
  }

  /**
   * Generate practical takeaways from a topic
   */
  async generatePracticalTakeaways(topicTitle: string, content: string): Promise<string> {
    const prompt = `Based on this Chassidic teaching about "${topicTitle}", generate 3-5 practical takeaways that someone can apply in their daily life.

Content:
${content}

Format as a markdown list with clear, actionable items.`;

    return this.generateContent(prompt);
  }

  /**
   * Generate a mashal (parable) for a concept
   */
  async generateMashal(concept: string, nimshal: string): Promise<string> {
    const prompt = `Create a meaningful mashal (parable) to illustrate this Chassidic concept:

Concept: ${concept}
Nimshal (Lesson): ${nimshal}

Write a short, relatable story that clearly illustrates this teaching. Keep it concise (2-3 paragraphs).`;

    return this.generateContent(prompt);
  }

  /**
   * Improve and enhance existing content
   */
  async enhanceContent(content: string, instructions?: string): Promise<string> {
    const prompt = `Improve the following Chassidic content while maintaining its meaning and depth:

${content}

${instructions ? `Specific instructions: ${instructions}` : 'Make it clearer, more engaging, and better structured.'}

Return the enhanced version in markdown format.`;

    return this.generateContent(prompt);
  }

  /**
   * Generate common confusions Q&A
   */
  async generateCommonConfusions(topicTitle: string, content: string): Promise<Array<{ question: string; answer: string }>> {
    const prompt = `Based on this Chassidic teaching about "${topicTitle}", generate 3-4 common questions or confusions people might have, along with clear answers.

Content:
${content}

Return as JSON array with format: [{"question": "...", "answer": "..."}]`;

    const response = await this.generateContent(prompt);
    
    try {
      // Extract JSON from response (in case it's wrapped in markdown code blocks)
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      return [];
    }
  }

  /**
   * Generate key concepts from content
   */
  async generateKeyConcepts(content: string): Promise<Array<{ concept: string; explanation: string }>> {
    const prompt = `Extract 3-5 key concepts from this Chassidic teaching and provide brief explanations:

${content}

Return as JSON array with format: [{"concept": "...", "explanation": "..."}]`;

    const response = await this.generateContent(prompt);
    
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      return [];
    }
  }

  /**
   * Summarize long content
   */
  async summarize(content: string, maxLength = 200): Promise<string> {
    const prompt = `Summarize the following Chassidic teaching in approximately ${maxLength} words:

${content}

Maintain the key insights and spiritual depth.`;

    return this.generateContent(prompt);
  }

  /**
   * Generate historical context for a topic
   */
  async generateHistoricalContext(topicTitle: string, era?: string): Promise<string> {
    const prompt = `Provide historical context for the Chassidic concept of "${topicTitle}"${era ? ` during the ${era} period` : ''}.

Include:
- When and where this teaching emerged
- Key figures who developed or taught it
- Historical circumstances that influenced it
- How it evolved over time

Write in markdown format, 2-3 paragraphs.`;

    return this.generateContent(prompt);
  }
}

export const aiAssistant = new AIAssistant();
