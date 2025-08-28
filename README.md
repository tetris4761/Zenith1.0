# Zenith — Study Workflow Companion

A React + Vite + TypeScript app styled with TailwindCSS and integrated with Supabase for authentication and data storage.

## 🚀 Quick Start

1. **Clone and install:**
   ```bash
   git clone <your-repo-url>
   cd zenith
   npm install
   ```

2. **Environment setup:**
   Create `.env.local` in the `zenith/` directory:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_APP_NAME=Zenith
   ```

3. **Run locally:**
   ```bash
   npm run dev
   ```

## 🌐 Deployment

### GitHub Setup
1. Initialize Git: `git init`
2. Add files: `git add .`
3. Commit: `git commit -m "Initial commit"`
4. Create GitHub repo (public)
5. Push: `git push -u origin main`

### Vercel Deployment
1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push

## 🔧 Development

- **Supabase client** - `src/lib/supabase.ts`
- **Auth context** - `src/contexts/AuthContext.tsx`
- **Styling** - TailwindCSS with custom academic palette
- **Build** - `npm run build`

## 📁 Project Structure

```
zenith/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Route components
│   ├── contexts/      # React contexts (Auth)
│   ├── lib/           # Utilities (Supabase client)
│   └── types/         # TypeScript definitions
├── supabase/          # Database migrations
├── .env.local         # Environment variables (not in Git)
└── vercel.json        # Deployment configuration
```

## 🔐 Environment Variables

- **VITE_SUPABASE_URL** - Your Supabase project URL
- **VITE_SUPABASE_ANON_KEY** - Your Supabase anonymous key
- **VITE_APP_NAME** - Application name (optional)

## 🎨 Features

- ✅ **Authentication** - Supabase Auth with fallback
- ✅ **Responsive Design** - TailwindCSS with custom theme
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Modern Stack** - React 18, Vite 7, PostCSS
- ✅ **Deployment Ready** - Vercel configuration included
