# Umami Analytics Setup Guide

This guide walks through setting up Umami analytics for Chabad Mafteach.

## 🚀 Quick Start

### Option A: Umami Cloud (Recommended)

Use Umami Cloud if you want the simplest, production-grade setup without managing servers.

1. Add this to `.env.local` (and production env):

```bash
NEXT_PUBLIC_UMAMI_WEBSITE_ID=ff2fc67f-9497-4b63-93b3-c8e8aff17a97
UMAMI_CLOUD_SCRIPT_SRC=https://cloud.umami.is/script.js

# Server-side reads for /analytics/topics (DO NOT expose this to the client)
UMAMI_CLOUD_API_KEY=your_umami_cloud_api_key_here
```

2. Deploy.

### Option B: Self-hosted Umami (Advanced)

If you want to self-host, continue below.

### 1. Run the Setup Script

```bash
# From project root
./scripts/setup-umami.sh
```

This will:
- Generate secure credentials
- Start Umami with Docker Compose
- Wait for it to be ready
- Provide next steps

### 2. Configure Umami

1. **Login to Umami Dashboard**
   - URL: http://localhost:3000
   - Email: `admin`
   - Password: `umami`

2. **Change Admin Password** (IMPORTANT!)
   - Go to Settings → Profile
   - Change the default password

3. **Add Your Website**
   - Click "Add website"
   - Name: `Chabad Mafteach`
   - Domain: `localhost:3000` (for development)
   - Copy the generated Website ID

### 3. Configure Environment Variables

Create/update your `.env.local`:

```bash
# Umami Analytics
UMAMI_WEBSITE_ID=your-website-id-here
UMAMI_HOST=http://localhost:3000
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id-here  # For client-side tracking

# Server-side API access (used by /api/analytics/topics to pull real stats)
UMAMI_USERNAME=admin
UMAMI_PASSWORD=your-admin-password-here
```

### 4. Restart Your App

```bash
npm run dev
```

## 📊 What Gets Tracked

### Automatic Page Views
- All page visits
- Topic pages (`/topics/[slug]`)
- Search results
- Admin pages (if logged in)

### Custom Events
- **Search**: Search queries and result counts
- **Citation Clicks**: When users click on citations
- **Topic Exports**: When users export topics
- **Content Engagement**: Views, shares, bookmarks
- **Admin Actions**: Content management activities

## 🔧 Advanced Configuration

### Custom Script Name (Ad Blocker Bypass)

The setup uses `analytics.js` instead of the default `umami.js` to avoid ad blockers.

### Custom Domains

Update the domains array in `app/layout.tsx`:

```tsx
domains={['chabad-mafteach.org', 'localhost:3000', 'beta.chassiduswiki.com']}
```

### API Key (Optional)

For Umami Cloud you use an API key via `UMAMI_CLOUD_API_KEY` (or `UMAMI_API_KEY`) and the endpoint `https://api.umami.is/v1`.

Never commit API keys to git.

1. In Umami, go to Settings → API Keys
2. Generate an API key
3. Add to `.env.local` as `UMAMI_API_KEY`

## 📈 Viewing Analytics

### In Umami Dashboard
- Real-time visitors
- Page views and sessions
- Top pages
- Referrers
- Devices and browsers
- Geographic data (city-level!)

### In Your App
- Visit `/analytics/topics` for topic-specific analytics
- Admin dashboard shows real-time metrics

## 🛠 Development vs Production

### Development
- Tracking works but data is mixed with development traffic
- Use `localhost:3000` as domain

### Production
- Only tracks when `NODE_ENV=production`
- Use your actual domain
- Real user data only

## 🔍 Troubleshooting

### Umami Not Starting
```bash
# Check logs
docker-compose -f docker-compose.umami.yml logs

# Restart
docker-compose -f docker-compose.umami.yml restart
```

### No Data Showing
1. Check environment variables are set
2. Verify website ID is correct
3. Check browser console for script errors
4. Ensure tracking script loads (check Network tab)

If `/analytics/topics` is still showing fallback data, ensure `UMAMI_USERNAME` and `UMAMI_PASSWORD` are set (server-side), and `UMAMI_HOST` is reachable from the Next.js server.

### API Errors
- Check Umami is running on port 3000
- Verify API key if configured
- Check CORS settings

## 📝 Custom Events Example

```tsx
import { useUmamiAnalytics } from '@/hooks/useUmamiAnalytics';

function MyComponent() {
  const { trackCitationClick } = useUmamiAnalytics();
  
  const handleCitationClick = (sourceId: string) => {
    trackCitationClick(sourceId, "Tanya, Chapter 1");
  };
  
  return <button onClick={() => handleCitationClick("123")}>View Source</button>;
}
```

## 🔄 Migration from Placeholder

The `/analytics/topics` page now:
1. **Pulls real data** from Umami when configured
2. **Falls back** to Directus statement counts if Umami unavailable
3. **Shows proper metrics**: page views, visitors, bounces
4. **Updates in real-time** as users browse

## 📚 Additional Resources

- [Umami Documentation](https://umami.is/docs)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Privacy-First Analytics](https://umami.is/blog/privacy-first-analytics)
