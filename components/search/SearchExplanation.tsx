import React from 'react';
import { Search, Info, Zap } from 'lucide-react';

interface SearchExplanationProps {
  explanation: string;
  mode: string;
  showSemanticIndicators?: boolean;
  isHebrew?: boolean;
}

export function SearchExplanation({ 
  explanation, 
  mode, 
  showSemanticIndicators = false, 
  isHebrew = false 
}: SearchExplanationProps) {
  const getIcon = () => {
    switch (mode) {
      case 'semantic':
        return <Zap className="w-4 h-4 text-purple-500" />;
      case 'hybrid':
        return <Search className="w-4 h-4 text-blue-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-500" />;
    }
  };

  const getColor = () => {
    switch (mode) {
      case 'semantic':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'hybrid':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm ${getColor()}`}>
      {getIcon()}
      <span className="font-medium">{explanation}</span>
      {showSemanticIndicators && (
        <div className="flex items-center gap-1 ml-2">
          <div className="w-2 h-2 rounded-full bg-purple-400" />
          <span className="text-xs">AI</span>
        </div>
      )}
      {isHebrew && (
        <span className="text-xs opacity-75">עברית</span>
      )}
    </div>
  );
}
