# Onboarding System Documentation

## Overview

The onboarding system provides contextual guidance to help users discover and understand Chabad Mafteach features. It's designed to be maintainable, extensible, and user-friendly.

## Architecture

### Core Components

1. **`OnboardingProvider`** (`/lib/hooks/useOnboarding.tsx`)
   - Global state management for onboarding progress
   - Tracks completed steps in localStorage
   - Coordinates step progression and prerequisites

2. **`OnboardingManager`** (`/components/onboarding/OnboardingManager.tsx`)
   - Renders the current active onboarding step
   - Handles step transitions and user interactions

3. **`OnboardingStep`** (`/components/onboarding/OnboardingStep.tsx`)
   - Individual tooltip/guide component
   - Auto-positions relative to target elements
   - Supports multiple placement options and interactions

## Adding New Onboarding Steps

### Step Definition Structure

Each onboarding step is defined in the `ONBOARDING_STEPS` array in `useOnboarding.tsx`:

```typescript
{
  id: 'unique-step-id',
  title: 'Brief, action-oriented title',
  description: 'Clear explanation of what to do or learn',
  target: '[data-onboarding="target-element"]', // CSS selector
  placement: 'bottom', // 'top' | 'bottom' | 'left' | 'right' | 'center'
  showWhen: () => true, // Optional condition for when to show
  prerequisites: ['previous-step-id'], // Steps that must be completed first
  priority: 80, // Higher numbers = higher priority
  autoAdvance: false, // Automatically complete after interaction
  ctaText: 'Custom CTA text' // Defaults to 'Got it'
}
```

### Step Types

1. **Welcome Messages** (`placement: 'center'`)
   - Full-screen overlays for important introductions
   - No target element required

2. **Contextual Tooltips** (`placement: 'top|bottom|left|right'`)
   - Point to specific UI elements
   - Require `target` CSS selector

3. **Progressive Hints**
   - Build upon each other with prerequisites
   - Higher priority steps shown first

## Targeting Elements

Add `data-onboarding` attributes to elements you want to highlight:

```tsx
<div data-onboarding="search-section">
  <CommandMenuTrigger />
</div>

<button data-onboarding="bookmark-button">
  <BookmarkIcon />
</button>
```

## Usage in Components

### Basic Usage

```tsx
import { useOnboarding } from '@/lib/hooks/useOnboarding';

function MyComponent() {
  const { markCompleted } = useOnboarding();

  const handleUserAction = () => {
    // User performed the action this step teaches
    markCompleted('step-id');
  };

  return (
    <button onClick={handleUserAction}>
      Do Something
    </button>
  );
}
```

### Advanced Usage

```tsx
import { useOnboarding } from '@/lib/hooks/useOnboarding';

function FeatureComponent() {
  const { currentStep, completedSteps } = useOnboarding();

  // Highlight element when onboarding targets it
  const isHighlighted = currentStep?.target === '[data-onboarding="my-feature"]';

  return (
    <div className={isHighlighted ? 'ring-2 ring-primary' : ''}>
      {/* Component content */}
    </div>
  );
}
```

## Maintenance Guide

### When Features Change

1. **UI Element Moves**: Update the `target` selector in the step definition
2. **Feature Removed**: Remove the step from `ONBOARDING_STEPS`
3. **New Feature Added**: Add new step with appropriate prerequisites
4. **Step Priority Changes**: Adjust priority numbers to change display order

### When Adding New Features

1. Add `data-onboarding` attributes to key UI elements
2. Define new steps in `ONBOARDING_STEPS`
3. Set appropriate prerequisites and priorities
4. Test the onboarding flow
5. Update this documentation

### Testing Onboarding

Use the development controls (only in dev mode):

```tsx
import { OnboardingDevControls } from '@/components/onboarding/OnboardingManager';

// Add to your component for testing
<OnboardingDevControls />
```

This provides buttons to reset or skip onboarding for testing purposes.

## Best Practices

### Content Guidelines

- **Keep it concise**: Users scan, don't read
- **Action-oriented**: Tell users what to do, not what they can do
- **Progressive**: Start with basics, build to advanced features
- **Contextual**: Show hints when/where they're most relevant

### Technical Guidelines

- **Unique IDs**: Use descriptive, unique identifiers
- **Robust selectors**: Use stable CSS selectors that won't break with styling changes
- **Performance**: Onboarding only loads when active
- **Accessibility**: All tooltips are keyboard accessible

### Example Step Progression

```typescript
// Basic onboarding flow
[
  {
    id: 'welcome-search',
    title: 'Start Your Journey',
    description: 'Press Cmd+K to search...',
    placement: 'center',
    priority: 100
  },
  {
    id: 'explore-content',
    title: 'Discover Topics',
    description: 'Browse topics below...',
    target: '[data-onboarding="topics-section"]',
    placement: 'bottom',
    priority: 90,
    prerequisites: ['welcome-search']
  },
  {
    id: 'save-bookmarks',
    title: 'Save for Later',
    description: 'Click bookmark icons...',
    target: '[data-onboarding="bookmark-button"]',
    placement: 'top',
    priority: 70,
    prerequisites: ['explore-content']
  }
]
```

## Troubleshooting

### Common Issues

1. **Tooltip not appearing**: Check if target element exists and has correct selector
2. **Wrong positioning**: Verify placement value and target element positioning
3. **Steps not progressing**: Ensure `markCompleted()` is called after user actions
4. **Prerequisites not working**: Check that prerequisite step IDs are correct

### Debug Mode

In development, you can access:
- Current step ID
- Completed steps count
- Reset/skip controls

## Future Enhancements

Potential improvements for when the app grows:

1. **Analytics Integration**: Track onboarding completion rates
2. **A/B Testing**: Test different onboarding flows
3. **Personalized Onboarding**: Show different steps based on user behavior
4. **Multi-step Tours**: Complex guided tours for advanced features
5. **Mobile-specific Steps**: Different onboarding for mobile vs desktop

## Files to Update

When maintaining this system, you may need to modify:

- `/lib/hooks/useOnboarding.tsx` - Add/remove step definitions
- `/components/onboarding/OnboardingStep.tsx` - Customize tooltip appearance
- `/components/onboarding/OnboardingManager.tsx` - Modify flow logic
- Component files - Add `data-onboarding` attributes
- This documentation - Update when adding new patterns

---

**Remember**: Onboarding should enhance, not hinder, the user experience. Keep it helpful, unobtrusive, and easy to skip.
