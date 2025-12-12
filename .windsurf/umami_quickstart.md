# Quick Umami Setup for Bilingual Analytics

## 🚀 **Deploy Umami on Railway (5 minutes)**

### **Step 1: Railway Setup**
1. Go to [Railway.app](https://railway.app)
2. Create new project → "Deploy from GitHub"
3. Search for "umami-software/umami"
4. Click "Deploy"

### **Step 2: Environment Variables**
Add these in Railway:
```env
DATABASE_URL=postgresql://...
HASH_SALT=your_random_salt
NEXTAUTH_URL=https://your-umami-domain.up.railway.app
NEXTAUTH_SECRET=your_random_secret
```

### **Step 3: Connect to Your App**

#### **Install Umami Client:**
```bash
npm install @umami/node
```

#### **Add to your app (lib/analytics.ts):**
```typescript
import { track } from '@umami/node';

// Add alongside your Vercel tracking
export function trackUmami(event: string, data?: any) {
  track(event, data);
}

// Enhanced bilingual tracking
export function trackBilingualTopicView(
  topicId: string,
  topicName: string,
  languageUsed: 'he' | 'en' | 'transliteration',
  translationAvailable: boolean
) {
  // Vercel Analytics
  track('bilingual_topic_view', {
    topic_id: topicId,
    topic_name: topicName,
    language_used: languageUsed,
    translation_available: translationAvailable,
  });

  // Umami Analytics
  trackUmami('topic_view', {
    name: topicName,
    language: languageUsed,
    has_translation: translationAvailable,
  });
}
```

#### **Add Umami Script to Layout:**
```tsx
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src="https://your-umami-domain.up.railway.app/script.js"
          data-website-id="your-website-id"
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## 📊 **What You'll Get:**

### **Umami Dashboard Features:**
- ✅ **Real-time page views** with language filtering
- ✅ **Custom events** for your bilingual tracking
- ✅ **User journey flows** (how users navigate Hebrew/English content)
- ✅ **Geographic insights** (language preferences by region)
- ✅ **Device/browser analytics** (mobile vs desktop Hebrew reading)

### **Custom Events You'll Track:**
- `topic_view` - Which language version users see
- `language_switch` - When users change languages
- `translation_feedback` - Quality ratings
- `accessibility_barrier` - Language issues reported

## 🎯 **Perfect for Your Needs:**

**Umami excels at:**
- **Privacy compliance** (GDPR, CCPA)
- **Simple deployment** (Railway one-click)
- **Custom event flexibility** (your bilingual metrics)
- **Visual dashboards** (see user behavior immediately)

**Within 10 minutes** you'll have visual analytics showing:
- How many users see English vs Hebrew topics
- Which translations get the most engagement
- When users switch between languages
- Content accessibility issues

**Ready to deploy Umami?** It's the fastest way to get professional analytics dashboards for your bilingual app! 🚀📊
