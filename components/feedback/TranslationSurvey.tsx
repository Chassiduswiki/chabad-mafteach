'use client';

import { useState } from 'react';
import { trackTranslationSurvey } from '@/lib/analytics';

interface TranslationSurveyProps {
  isOpen: boolean;
  onClose: () => void;
  triggerContext?: string; // Where the survey was triggered from
}

export function TranslationSurvey({ isOpen, onClose, triggerContext }: TranslationSurveyProps) {
  const [step, setStep] = useState(1);
  const [responses, setResponses] = useState({
    // User context
    primaryLanguage: '' as 'he' | 'en' | '',
    hebrewProficiency: '' as 'none' | 'basic' | 'intermediate' | 'advanced' | 'native' | '',
    usagePurpose: '' as 'study' | 'research' | 'casual' | 'teaching' | '',

    // Translation priorities
    topicTranslations: '' as 'critical' | 'important' | 'nice' | 'unnecessary' | '',
    contentTranslations: '' as 'critical' | 'important' | 'nice' | 'unnecessary' | '',
    citationTranslations: '' as 'critical' | 'important' | 'nice' | 'unnecessary' | '',

    // Preferences
    preferredDisplay: '' as 'english_first' | 'hebrew_first' | 'bilingual' | 'auto' | '',
    machineTranslations: '' as 'acceptable' | 'prefer_human' | 'only_human' | '',

    // Additional feedback
    biggestBarrier: '' as 'reading_hebrew' | 'understanding_concepts' | 'finding_content' | 'other' | '',
    additionalComments: '',
  });

  const updateResponse = (field: keyof typeof responses, value: string) => {
    setResponses(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const userContext = {
      primaryLanguage: responses.primaryLanguage as 'he' | 'en' | undefined,
      hebrewProficiency: responses.hebrewProficiency as 'none' | 'basic' | 'intermediate' | 'advanced' | 'native' | undefined,
      usagePurpose: responses.usagePurpose as 'study' | 'research' | 'casual' | 'teaching' | undefined,
    };

    trackTranslationSurvey('translation_priority', responses, userContext);
    onClose();
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Help Us Improve Translations</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4].map((num) => (
              <div
                key={num}
                className={`h-2 flex-1 rounded ${
                  num <= step ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Step {step} of 4 • Your feedback helps us prioritize translation efforts
          </p>
        </div>

        {/* Step 1: User Context */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">What's your primary language?</label>
              <div className="space-y-2">
                {[
                  { value: 'en', label: 'English' },
                  { value: 'he', label: 'Hebrew' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center">
                    <input
                      type="radio"
                      name="primaryLanguage"
                      value={value}
                      checked={responses.primaryLanguage === value}
                      onChange={(e) => updateResponse('primaryLanguage', e.target.value)}
                      className="mr-3"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">How would you rate your Hebrew reading proficiency?</label>
              <div className="space-y-2">
                {[
                  { value: 'none', label: 'None - I cannot read Hebrew' },
                  { value: 'basic', label: 'Basic - I can read with difficulty' },
                  { value: 'intermediate', label: 'Intermediate - I can read but slowly' },
                  { value: 'advanced', label: 'Advanced - I read Hebrew comfortably' },
                  { value: 'native', label: 'Native - Hebrew is my primary language' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center">
                    <input
                      type="radio"
                      name="hebrewProficiency"
                      value={value}
                      checked={responses.hebrewProficiency === value}
                      onChange={(e) => updateResponse('hebrewProficiency', e.target.value)}
                      className="mr-3"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">What's your main purpose for using this platform?</label>
              <div className="space-y-2">
                {[
                  { value: 'study', label: 'Personal study and learning' },
                  { value: 'research', label: 'Academic research' },
                  { value: 'casual', label: 'Casual browsing' },
                  { value: 'teaching', label: 'Teaching others' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center">
                    <input
                      type="radio"
                      name="usagePurpose"
                      value={value}
                      checked={responses.usagePurpose === value}
                      onChange={(e) => updateResponse('usagePurpose', e.target.value)}
                      className="mr-3"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Translation Priorities */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">How important are English translations for topic names? (e.g., "Tzadik" → "Righteous Person")</label>
              <div className="space-y-2">
                {[
                  { value: 'critical', label: 'Critical - I cannot use the platform without them' },
                  { value: 'important', label: 'Important - They significantly help my experience' },
                  { value: 'nice', label: 'Nice to have - Helpful but not essential' },
                  { value: 'unnecessary', label: 'Unnecessary - I prefer Hebrew terms' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center">
                    <input
                      type="radio"
                      name="topicTranslations"
                      value={value}
                      checked={responses.topicTranslations === value}
                      onChange={(e) => updateResponse('topicTranslations', e.target.value)}
                      className="mr-3"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">How important are English translations for content (paragraphs, statements)?</label>
              <div className="space-y-2">
                {[
                  { value: 'critical', label: 'Critical - I need translations for all content' },
                  { value: 'important', label: 'Important - Translations for key content would help' },
                  { value: 'nice', label: 'Nice to have - I can manage with Hebrew content' },
                  { value: 'unnecessary', label: 'Unnecessary - I focus on Hebrew sources' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center">
                    <input
                      type="radio"
                      name="contentTranslations"
                      value={value}
                      checked={responses.contentTranslations === value}
                      onChange={(e) => updateResponse('contentTranslations', e.target.value)}
                      className="mr-3"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Preferences */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">What's your preferred way to view bilingual content?</label>
              <div className="space-y-2">
                {[
                  { value: 'english_first', label: 'English first, Hebrew secondary' },
                  { value: 'hebrew_first', label: 'Hebrew first, English secondary' },
                  { value: 'bilingual', label: 'Show both languages simultaneously' },
                  { value: 'auto', label: 'Auto-detect based on my language preference' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center">
                    <input
                      type="radio"
                      name="preferredDisplay"
                      value={value}
                      checked={responses.preferredDisplay === value}
                      onChange={(e) => updateResponse('preferredDisplay', e.target.value)}
                      className="mr-3"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">What's your preference regarding machine translations?</label>
              <div className="space-y-2">
                {[
                  { value: 'acceptable', label: 'Acceptable - Better than no translation' },
                  { value: 'prefer_human', label: 'Prefer human translations when available' },
                  { value: 'only_human', label: 'Only human-verified translations' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center">
                    <input
                      type="radio"
                      name="machineTranslations"
                      value={value}
                      checked={responses.machineTranslations === value}
                      onChange={(e) => updateResponse('machineTranslations', e.target.value)}
                      className="mr-3"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Final Feedback */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">What's the biggest barrier you face when using Hebrew content?</label>
              <div className="space-y-2">
                {[
                  { value: 'reading_hebrew', label: 'Reading Hebrew script' },
                  { value: 'understanding_concepts', label: 'Understanding the concepts (even in translation)' },
                  { value: 'finding_content', label: 'Finding the content I need' },
                  { value: 'other', label: 'Other (please describe below)' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center">
                    <input
                      type="radio"
                      name="biggestBarrier"
                      value={value}
                      checked={responses.biggestBarrier === value}
                      onChange={(e) => updateResponse('biggestBarrier', e.target.value)}
                      className="mr-3"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Any additional comments or suggestions?</label>
              <textarea
                value={responses.additionalComments}
                onChange={(e) => updateResponse('additionalComments', e.target.value)}
                placeholder="How can we better support your learning experience?"
                className="w-full p-3 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                rows={4}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            Step {step} of 4
          </div>

          {step < 4 ? (
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Submit Survey
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
