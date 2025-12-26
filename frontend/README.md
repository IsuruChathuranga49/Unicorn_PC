# 🦄 Unicorn PC Builder - Frontend

Next.js frontend for Unicorn PC Builder.

## 📋 Prerequisites

- Node.js 18+
- npm

## 🚀 Setup

1. **Install Dependencies**

```powershell
cd frontend
npm install
```

2. **Configure Environment Variables**

Create `.env.local` file:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

3. **Run Development Server**

```powershell
npm run dev
```

Frontend will start at: http://localhost:3000

## 📁 Project Structure

```
frontend/
├── app/
│   ├── page.jsx                    # Homepage
│   ├── layout.jsx                  # Root layout
│   ├── globals.css                 # Global styles
│   ├── intelligent-build/
│   │   └── page.jsx               # Intelligent Build page
│   ├── manual-build/
│   │   └── page.jsx               # Manual Build page
│   └── performance/
│       └── page.jsx               # Performance Prediction page
├── components/
│   └── (React components)
├── services/
│   └── api.js                     # API service layer
├── public/
├── package.json
└── next.config.mjs
```

## 🎨 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19
- **Styling**: Tailwind CSS 4
- **API**: Fetch API

## 🔗 API Integration

The frontend connects to the Flask backend at `http://localhost:5000`.

All API calls are handled through the `services/api.js` module:

```javascript
import { intelligentAPI, manualAPI, performanceAPI } from "@/services/api";

// Example: Get AI recommendation
const recommendation = await intelligentAPI.getRecommendation({
  budget: 1500,
  resolution: "1440P",
  use_case: "Gaming",
  fps: 120,
});
```

## 📄 Pages

### Homepage (`/`)

- Two cards: Intelligent Build & Manual Build
- Links to respective build modes

### Intelligent Build (`/intelligent-build`)

- Budget input
- Use case selector
- Resolution selector
- FPS target (for gaming)
- AI recommendation display

### Manual Build (`/manual-build`)

- 9-step component selection
- Real-time compatibility checking
- Price calculation sidebar
- Build validation

### Performance Prediction (`/performance`)

- FPS predictions (1080p, 1440p, 4K)
- Bottleneck analysis
- Gaming ratings
- Suitability scores

## 🧪 Development

```powershell
# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 🚀 Production Build

```powershell
npm run build
npm start
```

## 📝 Environment Variables

Create `.env.local` with:

```
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# For production:
# NEXT_PUBLIC_API_URL=https://your-backend-api.azurewebsites.net
```

## 🎯 Features

- ✅ Server-side rendering (SSR)
- ✅ Client-side navigation
- ✅ Responsive design (mobile-first)
- ✅ Tailwind CSS styling
- ✅ API service layer
- ✅ Error handling
- ✅ Loading states

## 📦 Dependencies

- `next`: ^15.1.0
- `react`: ^19.0.0
- `react-dom`: ^19.0.0
- `tailwindcss`: ^4.0.0

## 🔧 Configuration

### Next.js Config (`next.config.mjs`)

```javascript
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  },
};
```

### Tailwind Config

Tailwind CSS 4 uses `@import "tailwindcss"` in `globals.css`.

## 🌐 Deployment

### Vercel (Recommended)

```powershell
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Azure Static Web Apps

```powershell
# Build
npm run build

# Deploy using Azure CLI or GitHub Actions
```

## 📞 Support

For issues, check:

1. Backend is running on port 5000
2. `.env.local` is configured correctly
3. Dependencies are installed (`npm install`)
4. Browser console for errors

---

**© 2024 Unicorn PC Builder** 🦄
