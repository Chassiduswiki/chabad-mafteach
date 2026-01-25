'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Save, 
  Plus, 
  X, 
  Sparkles, 
  Globe, 
  Lock, 
  Image as ImageIcon,
  Tag,
  Loader2,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { cn } from '@/lib/utils';

export default function NewCollectionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');

  const handleAddTag = (e?: React.FormEvent) => {
    e?.preventDefault();
    const tag = currentTag.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          is_public: isPublic,
          tags,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create collection');
      }

      const collection = await response.json();
      router.push(`/collections/${collection.slug}`);
    } catch (error) {
      console.error('Create collection error:', error);
      alert(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.back()}
              className="rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Breadcrumbs items={[{ label: 'Collections', href: '/collections' }, { label: 'New' }]} />
          </div>
          <Button
            onClick={handleSave}
            disabled={isLoading || !title.trim()}
            className="rounded-full px-6 font-bold text-xs"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-2" />
            )}
            Create Collection
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-10 space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
            <Sparkles className="h-4 w-4" />
            Curate Wisdom
          </div>
          <h1 className="text-4xl font-serif italic tracking-tight text-foreground">
            New Collection
          </h1>
          <p className="text-muted-foreground font-light">
            Group topics, add insights, and share your learning journey with others.
          </p>
        </div>

        <div className="space-y-8">
          {/* Basic Info */}
          <section className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Collection Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Fundamentals of Chassidus"
                className="h-12 text-lg bg-muted/20 border-primary/10 focus-visible:ring-primary/20 font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this collection about? Who is it for?"
                className="min-h-[120px] bg-muted/20 border-primary/10 focus-visible:ring-primary/20 resize-none"
              />
            </div>
          </section>

          {/* Settings */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <Card className="border-primary/10 bg-card/50 overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      {isPublic ? <Globe className="h-3.5 w-3.5 text-emerald-500" /> : <Lock className="h-3.5 w-3.5 text-amber-500" />}
                      Visibility
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {isPublic ? 'Everyone can discover and view' : 'Only you can access this collection'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPublic(!isPublic)}
                    className="rounded-full h-8 px-4 text-[10px] font-bold uppercase"
                  >
                    {isPublic ? 'Make Private' : 'Make Public'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/10 bg-card/50 overflow-hidden">
              <CardContent className="p-5 space-y-4 opacity-50 cursor-not-allowed">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <ImageIcon className="h-3.5 w-3.5 text-blue-500" />
                      Cover Image
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Upload a background image
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="rounded-full h-8 px-4 text-[10px] font-bold uppercase"
                  >
                    Upload
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Tags */}
          <section className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Tags
              </label>
              <form onSubmit={handleAddTag} className="flex gap-2">
                <div className="relative flex-grow">
                  <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="Add tags (e.g., Tanya, Avodah)..."
                    className="pl-10 h-10 bg-muted/20 border-primary/10 focus-visible:ring-primary/20"
                  />
                </div>
                <Button 
                  type="submit" 
                  variant="outline" 
                  disabled={!currentTag.trim()}
                  className="h-10 rounded-lg"
                >
                  Add
                </Button>
              </form>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {tags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="pl-3 pr-1.5 py-1.5 rounded-full bg-primary/5 border-primary/10 text-primary hover:bg-primary/10 transition-colors"
                  >
                    {tag}
                    <button 
                      onClick={() => removeTag(tag)}
                      className="ml-2 p-0.5 hover:bg-primary/20 rounded-full transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </section>

          {/* Preview Placeholder */}
          <section className="pt-8 border-t border-border/50">
            <div className="bg-muted/10 border border-dashed border-border rounded-3xl p-12 text-center space-y-4">
              <div className="bg-background w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mx-auto text-muted-foreground/30">
                <BookOpen className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-foreground">Build your collection</h4>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  After creating the collection, you can add topics directly from their pages or via search.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
