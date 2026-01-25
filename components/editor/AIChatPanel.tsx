'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, X, Bot, User, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicTitle: string;
}

export function AIChatPanel({ open, onOpenChange, topicTitle }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage: Message = { 
      role: 'user', 
      content: input,
      timestamp: new Date()
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'enhance_content',
          data: {
            content: input,
            instructions: `As an AI assistant specialized in Chassidic thought, please help with the following request about "${topicTitle}": ${input}. Provide a clear, insightful response formatted in markdown. Keep it scholarly yet accessible.`
          }
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to get AI response');
      }

      const data = await response.json();
      
      if (data.success && data.result) {
        setMessages([...newMessages, { 
          role: 'assistant', 
          content: data.result,
          timestamp: new Date()
        }]);
      } else {
        throw new Error(data.error || 'Invalid response from AI');
      }
    } catch (err) {
      console.error('AIChatPanel Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get AI response.');
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-24 right-6 w-[400px] max-h-[600px] h-[80vh] flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-300">
      <Card className="h-full flex flex-col shadow-2xl border-primary/20 bg-background/95 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between border-b py-3 px-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">AI Assistant</CardTitle>
              <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                Discussing: {topicTitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-destructive" 
              onClick={clearChat}
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent 
          ref={scrollRef}
          className="flex-grow overflow-y-auto p-4 space-y-4 scroll-smooth"
        >
          {messages.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-60 py-10">
              <div className="bg-muted p-3 rounded-full">
                <Bot className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">How can I help today?</p>
                <p className="text-xs text-muted-foreground">Ask about concepts, sources, or for help writing.</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={cn(
                "flex gap-3 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={cn(
                "p-3 rounded-2xl text-sm shadow-sm",
                msg.role === 'user' 
                  ? "bg-primary text-primary-foreground rounded-tr-none" 
                  : "bg-muted text-foreground rounded-tl-none"
              )}>
                <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:bg-black/10 prose-pre:p-2 prose-pre:rounded">
                  <ReactMarkdown>
                    {msg.content}
                  </ReactMarkdown>
                </div>
                <span className={cn(
                  "text-[9px] mt-1 block opacity-50 text-right",
                  msg.role === 'user' ? "text-primary-foreground" : "text-muted-foreground"
                )}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-3 mr-auto max-w-[85%] animate-pulse">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="p-3 rounded-2xl bg-muted rounded-tl-none flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex justify-center py-2">
              <p className="text-[11px] text-destructive bg-destructive/10 px-3 py-1 rounded-full border border-destructive/20">
                {error}
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <div className="flex w-full gap-2 relative">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about the topic..."
              className="pr-10 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/30"
              disabled={loading}
            />
            <Button 
              size="icon" 
              className="absolute right-1 top-1 h-8 w-8 rounded-md transition-all shrink-0" 
              onClick={handleSend} 
              disabled={loading || !input.trim()}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
