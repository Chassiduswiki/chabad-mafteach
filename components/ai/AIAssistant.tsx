'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AIAssistantProps {
  onTranslationComplete?: (translation: string) => void;
  onEnhancementComplete?: (enhanced: string) => void;
  mode?: 'translate' | 'enhance' | 'both';
  initialText?: string;
}

export function AIAssistant({ 
  onTranslationComplete, 
  onEnhancementComplete,
  mode = 'both',
  initialText = ''
}: AIAssistantProps) {
  const [text, setText] = useState(initialText);
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Hebrew');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleTranslate = async () => {
    if (!text.trim()) {
      setError('Please enter text to translate');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sourceLang,
          targetLang,
          context: 'Chassidic literature translation'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Translation failed');
      }

      const data = await response.json();
      setResult(data.translation);
      setSuccess(true);
      
      if (onTranslationComplete) {
        onTranslationComplete(data.translation);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEnhance = async () => {
    if (!text.trim()) {
      setError('Please enter text to enhance');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Enhance and improve this Chassidic text while maintaining its meaning and style: ${text}`,
          context: 'Content enhancement'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Enhancement failed');
      }

      const data = await response.json();
      setResult(data.content);
      setSuccess(true);
      
      if (onEnhancementComplete) {
        onEnhancementComplete(data.content);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enhancement failed');
    } finally {
      setLoading(false);
    }
  };

  const showTranslate = mode === 'translate' || mode === 'both';
  const showEnhance = mode === 'enhance' || mode === 'both';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Assistant
        </CardTitle>
        <CardDescription>
          Use AI to translate or enhance your content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ai-text">Text</Label>
          <Textarea
            id="ai-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to translate or enhance..."
            rows={4}
            className="resize-none"
          />
        </div>

        {showTranslate && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source-lang">Source Language</Label>
              <Select value={sourceLang} onValueChange={setSourceLang}>
                <SelectTrigger id="source-lang">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Hebrew">Hebrew</SelectItem>
                  <SelectItem value="Yiddish">Yiddish</SelectItem>
                  <SelectItem value="Aramaic">Aramaic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-lang">Target Language</Label>
              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger id="target-lang">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hebrew">Hebrew</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Yiddish">Yiddish</SelectItem>
                  <SelectItem value="Aramaic">Aramaic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {showTranslate && (
            <Button 
              onClick={handleTranslate} 
              disabled={loading || !text.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Translate
                </>
              )}
            </Button>
          )}
          
          {showEnhance && (
            <Button 
              onClick={handleEnhance} 
              disabled={loading || !text.trim()}
              variant="outline"
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Enhance
                </>
              )}
            </Button>
          )}
        </div>

        {error && (
          <Alert className="border-destructive bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        {success && result && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Result:</p>
                <div className="p-3 bg-muted rounded-md">
                  <p className="whitespace-pre-wrap">{result}</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
