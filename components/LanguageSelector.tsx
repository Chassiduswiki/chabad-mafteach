"use client";

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  value: string;
  onChange: (lang: string) => void;
  availableLanguages?: Array<{ code: string; name: string }>;
  className?: string;
}

const DEFAULT_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'he', name: 'עברית (Hebrew)' },
  { code: 'yi', name: 'ייִדיש (Yiddish)' },
  { code: 'ru', name: 'Русский (Russian)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'es', name: 'Español (Spanish)' },
];

export function LanguageSelector({ 
  value, 
  onChange, 
  availableLanguages = DEFAULT_LANGUAGES,
  className 
}: LanguageSelectorProps) {
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Globe className="w-4 h-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {availableLanguages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
