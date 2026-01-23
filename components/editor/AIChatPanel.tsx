'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, X } from 'lucide-react';

interface AIChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicTitle: string;
}

export function AIChatPanel({ open, onOpenChange, topicTitle }: AIChatPanelProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user' as const, content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would call an API
      // For now, we simulate a response
      setTimeout(() => {
        setMessages([...newMessages, { role: 'assistant' as const, content: `This is an AI response about ${topicTitle} regarding: "${input}"` }]);
        setLoading(false);
      }, 1500);
    } catch (err) {
      setError('Failed to get AI response.');
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-28 right-8 w-96 bg-background border rounded-lg shadow-xl z-50">
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>AI Assistant</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </CardContent>
        <CardFooter>
          <div className="flex w-full gap-2">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about the topic..."
            />
            <Button onClick={handleSend} disabled={loading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
