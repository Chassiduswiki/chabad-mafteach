'use client';

import { useState } from 'react';
import { Share2, Twitter, Facebook, Link2, Check, Mail, Globe, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
  compact?: boolean;
}

export function SocialShare({
  url,
  title,
  description,
  className = '',
  compact = false
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const shareText = description || title;

  const socialPlatforms = [
    {
      name: 'X / Twitter',
      icon: Twitter,
      color: 'bg-black text-white hover:bg-black/80',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-[#1877F2] text-white hover:bg-[#1877F2]/80',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    },
    {
      name: 'WhatsApp',
      icon: Send,
      color: 'bg-[#25D366] text-white hover:bg-[#25D366]/80',
      url: `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-muted text-muted-foreground hover:bg-muted/80',
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareText}\n\n${url}`)}`
    }
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Native share failed:', err);
        }
      }
    } else {
      setShowMenu(!showMenu);
    }
  };

  if (compact) {
    return (
      <div className={cn('relative inline-block', className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNativeShare}
          className="h-8 gap-2 rounded-full bg-muted/50 hover:bg-muted font-bold text-[10px] uppercase tracking-wider"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </Button>

        {showMenu && (
          <div className="absolute top-full mt-2 right-0 bg-background/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-2 z-50 min-w-[220px] animate-in fade-in slide-in-from-top-2">
            <div className="px-3 py-2 border-b border-border/50 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Share via</span>
            </div>
            <div className="grid gap-1">
              {socialPlatforms.map((platform) => (
                <a
                  key={platform.name}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2 text-xs font-medium rounded-xl transition-all",
                    platform.color
                  )}
                  onClick={() => setShowMenu(false)}
                >
                  <platform.icon className="w-3.5 h-3.5" />
                  {platform.name}
                </a>
              ))}
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-3 w-full px-3 py-2 text-xs font-medium bg-muted/50 text-foreground hover:bg-muted rounded-xl transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Link2 className="w-3.5 h-3.5" />}
                {copied ? 'Copied to clipboard' : 'Copy direct link'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6 p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl', className)}>
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-xl text-primary">
          <Share2 className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-lg tracking-tight">Share Collection</h3>
      </div>
      
      {/* Native Share Button */}
      {typeof navigator !== 'undefined' && !!navigator.share && (
        <Button
          onClick={handleNativeShare}
          className="w-full h-12 rounded-2xl font-bold text-sm shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Native Share
        </Button>
      )}

      {/* Social Platform Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {socialPlatforms.map((platform) => (
          <a
            key={platform.name}
            href={platform.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all hover:scale-105 shadow-sm",
              platform.color
            )}
          >
            <platform.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-tight">{platform.name.split(' ')[0]}</span>
          </a>
        ))}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">
          <span className="bg-card/50 px-2">or copy link</span>
        </div>
      </div>

      {/* Copy Link */}
      <button
        onClick={handleCopyLink}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 bg-muted/30 border border-border/50 text-muted-foreground rounded-2xl transition-all hover:bg-muted group",
          copied && "border-emerald-500/30 bg-emerald-500/5 text-emerald-600"
        )}
      >
        <span className="text-xs font-mono truncate mr-4">{url}</span>
        <div className="flex items-center gap-2 shrink-0">
          {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4 group-hover:rotate-45 transition-transform" />}
          <span className="text-[10px] font-bold uppercase">{copied ? 'Copied' : 'Copy'}</span>
        </div>
      </button>
    </div>
  );
}
