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
   * Generate an outline for a comprehensive article
   */
  async generateOutline(topicTitle: string, briefDescription?: string): Promise<string> {
    const prompt = `You are a Chassidic scholar planning a comprehensive article.
    
Topic: ${topicTitle}
${briefDescription ? `Brief Description: ${briefDescription}` : ''}

Please create a detailed outline for an in-depth article about this Chassidic concept. 
Include headings for:
1. Introduction & Basic Definition
2. Philosophical Roots & Source Origins
3. Deeper Explanations & Analytical Breakdown
4. Practical Applications & Personal Relevance
5. Connections to related concepts

Format as a numbered list.`;

    return this.generateContent(prompt);
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
   * Predict potential relationships between topics based on content
   */
  async predictRelationships(content: string, existingRelationships?: any[]): Promise<Array<{
    topic_id: number;
    topic_title: string;
    relationship_type: string;
    confidence: number;
    explanation: string;
  }>> {
    const prompt = `Based on the content of this Chassidic topic, predict potential relationships with other topics. 
    
Topic Content: \"${content}\"
${existingRelationships ? `Existing Relationships to avoid: ${JSON.stringify(existingRelationships)}` : ''}

Respond in JSON format with an array of predictions:
{
  \"predictions\": [
    {
      \"topic_id\": 123,
      \"topic_title\": \"Concept Name\",
      \"relationship_type\": \"opposite\",
      \"confidence\": 0.92,
      \"explanation\": \"Brief explanation of the connection...\"
    }
  ]
}`;

    const response = await this.generateContent(prompt, { temperature: 0.3 });
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return data.predictions || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to parse relationship predictions:', error);
      return [];
    }
  }

  /**
   * Find relevant citations for a given query and context
   */
  async findCitations(query: string, context: string): Promise<Array<{
    source_id: number;
    source_title: string;
    reference: string;
    quote: string;
    relevance: number;
  }>> {
    const prompt = `As a Chassidic scholar, find relevant citations from the library that support or relate to the following query and context.
    
Query: \"${query}\"
Context: \"${context}\"

Respond in JSON format with an array of citations:
{
  \"citations\": [
    {
      \"source_id\": 1,
      \"source_title\": \"Tanya\",
      \"reference\": \"Chapter 1\",
      \"quote\": \"The soul of the Jew is truly a part of G-d above...\",
      \"relevance\": 0.95
    }
  ]
}`;

    const response = await this.generateContent(prompt, { temperature: 0.3 });
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return data.citations || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to parse citation suggestions:', error);
      return [];
    }
  }

  /**
   * Suggest improvements for a topic's content
   */
  async suggestImprovements(content: string): Promise<Array<{
    id: string;
    type: 'action' | 'content' | 'relationship';
    title: string;
    description: string;
    confidence: number;
  }>> {
    const prompt = `Analyze this Chassidic topic content and suggest 3-5 specific improvements:

Content: \"${content}\"

For each suggestion, provide:
1. A clear action title
2. Brief description of why it would help
3. Confidence score (0.0-1.0)
4. Type (action|content|relationship)

Respond in JSON format:
{
  \"suggestions\": [
    {
      \"id\": \"unique-id\",
      \"type\": \"action\",
      \"title\": \"Add source from Likkutei Sichos\",
      \"description\": \"The section on Ahava could be strengthened with a quote from Volume 2...\",
      \"confidence\": 0.85
    }
  ]
}`;

    const response = await this.generateContent(prompt, { temperature: 0.4 });
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return data.suggestions || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to parse suggestions:', error);
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
