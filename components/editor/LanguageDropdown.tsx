"use client";

import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Languages, 
  ChevronDown, 
  Check,
  Plus,
  Edit,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
  isRTL?: boolean;
  isDefault?: boolean;
  hasTranslation?: boolean;
  isPublished?: boolean;
}

interface LanguageDropdownProps {
  currentLanguage: string;
  availableLanguages: Language[];
  onLanguageChange: (languageCode: string) => void;
  onAddTranslation?: (languageCode: string) => void;
  onToggleVisibility?: (languageCode: string, visible: boolean) => void;
  onEditTranslation?: (languageCode: string) => void;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
  showTranslationStatus?: boolean;
  allowAddLanguages?: boolean;
  disabled?: boolean;
}

const DEFAULT_LANGUAGES: Language[] = [
  { 
    code: 'en', 
    name: 'English', 
    nativeName: 'English', 
    flag: '🇺🇸',
    isRTL: false,
    isDefault: true 
  },
  { 
    code: 'he', 
    name: 'Hebrew', 
    nativeName: 'עברית', 
    flag: '🇮🇱',
    isRTL: true,
    isDefault: false 
  },
  { 
    code: 'yi', 
    name: 'Yiddish', 
    nativeName: 'ייִדיש', 
    flag: '🕎',
    isRTL: true,
    isDefault: false 
  },
  { 
    code: 'ru', 
    name: 'Russian', 
    nativeName: 'Русский', 
    flag: '🇷🇺',
    isRTL: false,
    isDefault: false 
  },
  { 
    code: 'fr', 
    name: 'French', 
    nativeName: 'Français', 
    flag: '🇫🇷',
    isRTL: false,
    isDefault: false 
  },
  { 
    code: 'es', 
    name: 'Spanish', 
    nativeName: 'Español', 
    flag: '🇪🇸',
    isRTL: false,
    isDefault: false 
  },
  { 
    code: 'ar', 
    name: 'Arabic', 
    nativeName: 'العربية', 
    flag: '🇸🇦',
    isRTL: true,
    isDefault: false 
  },
];

export function LanguageDropdown({
  currentLanguage,
  availableLanguages = DEFAULT_LANGUAGES,
  onLanguageChange,
  onAddTranslation,
  onToggleVisibility,
  onEditTranslation,
  className,
  variant = 'default',
  showTranslationStatus = true,
  allowAddLanguages = true,
  disabled = false
}: LanguageDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLang = availableLanguages.find(lang => lang.code === currentLanguage) || availableLanguages[0];

  const handleLanguageSelect = (languageCode: string) => {
    if (!disabled) {
      onLanguageChange(languageCode);
      setIsOpen(false);
    }
  };

  const handleAddTranslation = (e: React.MouseEvent, languageCode: string) => {
    e.stopPropagation();
    if (onAddTranslation && !disabled) {
      onAddTranslation(languageCode);
      setIsOpen(false);
    }
  };

  const handleToggleVisibility = (e: React.MouseEvent, languageCode: string) => {
    e.stopPropagation();
    if (onToggleVisibility && !disabled) {
      const lang = availableLanguages.find(l => l.code === languageCode);
      if (lang) {
        onToggleVisibility(languageCode, !lang.isPublished);
      }
    }
  };

  const handleEditTranslation = (e: React.MouseEvent, languageCode: string) => {
    e.stopPropagation();
    if (onEditTranslation && !disabled) {
      onEditTranslation(languageCode);
      setIsOpen(false);
    }
  };

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="text-sm text-muted-foreground">Language:</span>
        <Select 
          value={currentLanguage} 
          onValueChange={handleLanguageSelect}
          disabled={disabled}
        >
          <SelectTrigger className="w-32">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span>{currentLang?.flag}</span>
                <span className="text-sm">{currentLang?.nativeName}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableLanguages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                <div className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                  {lang.isDefault && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 px-3 py-2 h-auto",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Globe className="w-4 h-4" />
        <div className="flex items-center gap-2">
          <span className="text-lg">{currentLang?.flag}</span>
          <div className="text-left">
            <div className="font-medium text-sm">{currentLang?.nativeName}</div>
            {showTranslationStatus && (
              <div className="text-xs text-muted-foreground">
                {currentLang?.hasTranslation ? '✓ Translated' : 'Add translation'}
              </div>
            )}
          </div>
        </div>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-background border rounded-lg shadow-lg z-50">
          <div className="p-2 border-b">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Languages className="w-4 h-4" />
              Language Selection
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {availableLanguages.map((lang) => {
              const isCurrent = lang.code === currentLanguage;
              const hasTranslation = lang.hasTranslation;
              const isPublished = lang.isPublished;
              
              return (
                <div
                  key={lang.code}
                  className={cn(
                    "flex items-center justify-between p-3 hover:bg-accent cursor-pointer transition-colors",
                    isCurrent && "bg-accent/50"
                  )}
                  onClick={() => handleLanguageSelect(lang.code)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{lang.flag}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{lang.nativeName}</span>
                        {lang.isDefault && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                        {lang.isRTL && (
                          <Badge variant="outline" className="text-xs">RTL</Badge>
                        )}
                        {isCurrent && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{lang.name}</div>
                      {showTranslationStatus && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {hasTranslation ? (
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {isPublished ? 'Published' : 'Draft'}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <EyeOff className="w-3 h-3" />
                              No translation
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {allowAddLanguages && !hasTranslation && !isCurrent && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleAddTranslation(e, lang.code)}
                        className="h-7 w-7 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    )}
                    {hasTranslation && !isCurrent && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleEditTranslation(e, lang.code)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    )}
                    {hasTranslation && onToggleVisibility && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleToggleVisibility(e, lang.code)}
                        className={cn(
                          "h-7 w-7 p-0",
                          isPublished && "text-primary"
                        )}
                      >
                        {isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {allowAddLanguages && (
            <div className="p-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  // Could open a dialog to add a new language
                  console.log('Add new language...');
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Language
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LanguageDropdown;
