/**
 * Smart Visibility Logic
 * 
 * Rules:
 * 1. Empty fields are ALWAYS hidden (regardless of toggle)
 * 2. Filled fields are shown by default
 * 3. User can manually hide a filled field via toggle (manuallyHidden)
 * 
 * The `visible` flag in displayConfig becomes `manuallyHidden` when false
 * - visible: true (or undefined) = show if has content
 * - visible: false = manually hidden, don't show even if has content
 */

export interface SmartVisibilityResult {
  isVisible: boolean;           // Final computed visibility
  hasContent: boolean;          // Does the field have content?
  isManuallyHidden: boolean;    // Did user explicitly hide it?
  reason: 'empty' | 'manually_hidden' | 'visible';
}

/**
 * Check if a field has meaningful content
 */
export function hasFieldContent(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') {
    // Strip HTML tags and check if there's actual text
    const textContent = value.replace(/<[^>]*>/g, '').trim();
    return textContent.length > 0;
  }
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

/**
 * Compute smart visibility for a field
 */
export function computeSmartVisibility(
  fieldValue: any,
  manualVisibility?: boolean // from displayConfig.visible
): SmartVisibilityResult {
  const hasContent = hasFieldContent(fieldValue);
  const isManuallyHidden = manualVisibility === false;
  
  // Rule 1: Empty fields are always hidden
  if (!hasContent) {
    return {
      isVisible: false,
      hasContent: false,
      isManuallyHidden: false,
      reason: 'empty',
    };
  }
  
  // Rule 2: If user manually hid it, respect that
  if (isManuallyHidden) {
    return {
      isVisible: false,
      hasContent: true,
      isManuallyHidden: true,
      reason: 'manually_hidden',
    };
  }
  
  // Rule 3: Has content and not manually hidden = visible
  return {
    isVisible: true,
    hasContent: true,
    isManuallyHidden: false,
    reason: 'visible',
  };
}

/**
 * Compute visibility for all sections of a topic
 */
export function computeTopicSectionVisibility(
  topicData: Record<string, any>,
  sectionConfigs: Array<{ id: string; field: string; displayConfig: { visible?: boolean } }>
): Record<string, SmartVisibilityResult> {
  const result: Record<string, SmartVisibilityResult> = {};
  
  for (const section of sectionConfigs) {
    const fieldValue = topicData[section.field];
    result[section.id] = computeSmartVisibility(
      fieldValue,
      section.displayConfig.visible
    );
  }
  
  return result;
}

/**
 * Get display status text for UI
 */
export function getVisibilityStatusText(result: SmartVisibilityResult): string {
  switch (result.reason) {
    case 'empty':
      return 'Hidden (no content)';
    case 'manually_hidden':
      return 'Hidden (manually)';
    case 'visible':
      return 'Visible';
    default:
      return 'Unknown';
  }
}

/**
 * Get status color class for UI
 */
export function getVisibilityStatusColor(result: SmartVisibilityResult): string {
  switch (result.reason) {
    case 'empty':
      return 'text-muted-foreground';
    case 'manually_hidden':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'visible':
      return 'text-green-600 dark:text-green-400';
    default:
      return 'text-muted-foreground';
  }
}
