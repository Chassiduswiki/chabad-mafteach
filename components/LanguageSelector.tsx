"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LanguageOption {
  code: string;
  name: string;
  nativeName?: string;
  available?: boolean;
  hasDescription?: boolean;
  translationQuality?: string;
  isMachineTranslated?: boolean;
}

interface LanguageSelectorProps {
  value: string;
  onChange: (lang: string) => void;
  availableLanguages?: LanguageOption[];
  showUnavailable?: boolean;
  className?: string;
}

const DEFAULT_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', available: true },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', available: true },
];

export function LanguageSelector({
  value,
  onChange,
  availableLanguages = DEFAULT_LANGUAGES,
  showUnavailable = false,
  className
}: LanguageSelectorProps) {
  // Filter to only show available languages unless showUnavailable is true
  const displayLanguages = showUnavailable
    ? availableLanguages
    : availableLanguages.filter(lang => lang.available !== false);

  const selectedLang = availableLanguages.find(l => l.code === value);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Globe className="w-4 h-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select language">
            {selectedLang && (
              <span className="flex items-center gap-2">
                <span>{selectedLang.name}</span>
                {selectedLang.isMachineTranslated && (
                  <span title="Machine translated">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                  </span>
                )}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {displayLanguages.map((lang) => {
            const isUnavailable = lang.available === false;
            const hasPartialContent = lang.available && !lang.hasDescription;

            return (
              <SelectItem
                key={lang.code}
                value={lang.code}
                disabled={isUnavailable}
                className={cn(
                  isUnavailable && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-2">
                    <span>{lang.name}</span>
                    {lang.nativeName && lang.nativeName !== lang.name && (
                      <span className="text-xs text-muted-foreground">
                        ({lang.nativeName})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {lang.isMachineTranslated && (
                      <span title="Machine translated">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                      </span>
                    )}
                    {hasPartialContent && (
                      <span title="Partial translation">
                        <AlertCircle className="w-3 h-3 text-orange-500" />
                      </span>
                    )}
                    {isUnavailable && (
                      <span className="text-[10px] text-muted-foreground">
                        (Coming soon)
                      </span>
                    )}
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
