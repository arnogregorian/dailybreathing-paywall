# Daily Breathing - Web Paywall

Vue + Vite frontend for RevenueCat web billing, hosted on Vercel. Can be embedded as a widget on any website.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

3. Add your environment variables to `.env`:
```
VITE_REVENUECAT_PUBLIC_API_KEY=your_revenuecat_public_api_key_here
VITE_SUPABASE_URL=https://olptyvvgdjxkdftibss.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Development

Run the development server:
```bash
npm run dev
```

## Build

Build for production:
```bash
npm run build
```

This creates embeddable files:
- `dist/paywall.js` - JavaScript bundle
- `dist/paywall.css` - Stylesheet

## Deploy to Vercel

1. Push your code to a Git repository
2. Import the project in Vercel
3. Add these environment variables in Vercel dashboard:
   - `VITE_REVENUECAT_PUBLIC_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

## Embedding the Widget

After deployment, embed the widget on any website:

```html
<!-- Add to your HTML -->
<link rel="stylesheet" href="https://web-paywall.vercel.app/paywall.css">
<script src="https://web-paywall.vercel.app/paywall.js"></script>

<!-- Option 1: Auto-initialize -->
<div data-daily-breathing-paywall="paywall-container"></div>

<!-- Option 2: Manual initialization -->
<div id="my-paywall"></div>
<script>
  window.initDailyBreathingPaywall('my-paywall');
</script>
```

See `embed-example.html` for a complete example.
