'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { Loader2, Sparkles, FileText, Lightbulb, BookOpen, History, Key } from 'lucide-react';

interface AIAssistantPanelProps {
  topicTitle?: string;
  currentContent?: string;
  onContentGenerated?: (content: string) => void;
}

export function AIAssistantPanel({ topicTitle, currentContent, onContentGenerated }: AIAssistantPanelProps) {
  const { generate, loading, error } = useAIGeneration();
  const [result, setResult] = useState<string>('');
  const [briefDescription, setBriefDescription] = useState('');
  const [concept, setConcept] = useState('');
  const [nimshal, setNimshal] = useState('');
  const [instructions, setInstructions] = useState('');

  const handleGenerate = async (action: string, data: Record<string, any>) => {
    try {
      const generatedContent = await generate({ action, data });
      setResult(typeof generatedContent === 'string' ? generatedContent : JSON.stringify(generatedContent, null, 2));
      if (onContentGenerated) {
        onContentGenerated(generatedContent);
      }
    } catch (err) {
      console.error('Generation failed:', err);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Assistant
        </CardTitle>
        <CardDescription>
          Generate and enhance content using AI (Gemini 2.0 Flash - Free)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="expand" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="expand">
              <FileText className="h-4 w-4 mr-2" />
              Expand
            </TabsTrigger>
            <TabsTrigger value="enhance">
              <Sparkles className="h-4 w-4 mr-2" />
              Enhance
            </TabsTrigger>
            <TabsTrigger value="generate">
              <Lightbulb className="h-4 w-4 mr-2" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="extract">
              <Key className="h-4 w-4 mr-2" />
              Extract
            </TabsTrigger>
          </TabsList>

          {/* Expand Article */}
          <TabsContent value="expand" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="briefDesc">Brief Description</Label>
              <Textarea
                id="briefDesc"
                placeholder="Enter a brief description of the topic..."
                value={briefDescription}
                onChange={(e) => setBriefDescription(e.target.value)}
                rows={4}
              />
            </div>
            <Button
              onClick={() => handleGenerate('expand_article', { topicTitle, briefDescription })}
              disabled={loading || !briefDescription || !topicTitle}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Expand into Full Article
                </>
              )}
            </Button>
          </TabsContent>

          {/* Enhance Content */}
          <TabsContent value="enhance" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instructions">Enhancement Instructions (Optional)</Label>
              <Textarea
                id="instructions"
                placeholder="E.g., 'Make it more accessible for beginners' or 'Add more depth'"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              onClick={() => handleGenerate('enhance_content', { content: currentContent, instructions })}
              disabled={loading || !currentContent}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Enhance Current Content
                </>
              )}
            </Button>
          </TabsContent>

          {/* Generate Sections */}
          <TabsContent value="generate" className="space-y-4">
            <div className="space-y-3">
              <Button
                onClick={() => handleGenerate('generate_practical_takeaways', { topicTitle, content: currentContent })}
                disabled={loading || !currentContent}
                className="w-full"
                variant="outline"
              >
                <Lightbulb className="mr-2 h-4 w-4" />
                Generate Practical Takeaways
              </Button>

              <Button
                onClick={() => handleGenerate('generate_historical_context', { topicTitle })}
                disabled={loading || !topicTitle}
                className="w-full"
                variant="outline"
              >
                <History className="mr-2 h-4 w-4" />
                Generate Historical Context
              </Button>

              <div className="space-y-2 pt-2">
                <Label>Generate Mashal (Parable)</Label>
                <Textarea
                  placeholder="Concept to illustrate..."
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  rows={2}
                />
                <Textarea
                  placeholder="Nimshal (lesson/meaning)..."
                  value={nimshal}
                  onChange={(e) => setNimshal(e.target.value)}
                  rows={2}
                />
                <Button
                  onClick={() => handleGenerate('generate_mashal', { concept, nimshal })}
                  disabled={loading || !concept || !nimshal}
                  className="w-full"
                  variant="outline"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Generate Mashal
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Extract Information */}
          <TabsContent value="extract" className="space-y-4">
            <div className="space-y-3">
              <Button
                onClick={() => handleGenerate('generate_key_concepts', { content: currentContent })}
                disabled={loading || !currentContent}
                className="w-full"
                variant="outline"
              >
                <Key className="mr-2 h-4 w-4" />
                Extract Key Concepts
              </Button>

              <Button
                onClick={() => handleGenerate('generate_confusions', { topicTitle, content: currentContent })}
                disabled={loading || !currentContent}
                className="w-full"
                variant="outline"
              >
                Generate Common Q&A
              </Button>

              <Button
                onClick={() => handleGenerate('summarize', { content: currentContent, maxLength: 200 })}
                disabled={loading || !currentContent}
                className="w-full"
                variant="outline"
              >
                Summarize Content
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <Label>Generated Content</Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(result);
                }}
              >
                Copy
              </Button>
            </div>
            <div className="p-4 bg-muted rounded-md max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
