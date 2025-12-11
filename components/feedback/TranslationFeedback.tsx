'use client';

import { useState } from 'react';
import { trackTranslationFeedback, trackTranslationSurvey } from '@/lib/analytics';

interface TranslationFeedbackProps {
  contentType: 'topic' | 'paragraph' | 'statement';
  contentId: string;
  contentName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TranslationFeedback({ contentType, contentId, contentName, isOpen, onClose }: TranslationFeedbackProps) {
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [aspects, setAspects] = useState({
    accuracy: null as 1 | 2 | 3 | 4 | 5 | null,
    readability: null as 1 | 2 | 3 | 4 | 5 | null,
    completeness: null as 1 | 2 | 3 | 4 | 5 | null,
  });
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!rating) return;

    trackTranslationFeedback(
      contentType,
      contentId,
      rating,
      {
        accuracy: aspects.accuracy || undefined,
        readability: aspects.readability || undefined,
        completeness: aspects.completeness || undefined,
      },
      feedback || undefined
    );

    setSubmitted(true);
    setTimeout(onClose, 2000); // Close after 2 seconds
  };

  const handleAspectRating = (aspect: keyof typeof aspects, value: 1 | 2 | 3 | 4 | 5) => {
    setAspects(prev => ({ ...prev, [aspect]: value }));
  };

  if (!isOpen) return null;

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
          <div className="text-center">
            <div className="text-green-500 text-4xl mb-4">✓</div>
            <h3 className="text-lg font-semibold mb-2">Thank you for your feedback!</h3>
            <p className="text-gray-600 dark:text-gray-400">Your input helps us improve translations for everyone.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Translation Feedback</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Help us improve translations for <strong>{contentName}</strong>
          </p>
        </div>

        {/* Overall Rating */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Overall Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star as 1 | 2 | 3 | 4 | 5)}
                className={`text-2xl ${rating && star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Aspects */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3">Rate Specific Aspects</label>

          {(['accuracy', 'readability', 'completeness'] as const).map((aspect) => (
            <div key={aspect} className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm capitalize">{aspect}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleAspectRating(aspect, num as 1 | 2 | 3 | 4 | 5)}
                      className={`w-6 h-6 text-xs rounded ${
                        aspects[aspect] === num
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Feedback */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Additional Comments (Optional)</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What could be improved about this translation?"
            className="w-full p-3 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={!rating}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Feedback
          </button>
        </div>
      </div>
    </div>
  );
}
