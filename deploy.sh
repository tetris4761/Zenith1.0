#!/bin/bash

echo "🚀 Zenith Deployment Script"
echo "=========================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the zenith directory"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found. Make sure to create it with your Supabase credentials."
fi

echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

echo ""
echo "🎯 Next steps:"
echo "1. Run: git init"
echo "2. Run: git add ."
echo "3. Run: git commit -m 'Initial commit: Zenith study app'"
echo "4. Create a GitHub repository (make it PUBLIC)"
echo "5. Run: git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"
echo "6. Run: git push -u origin main"
echo ""
echo "🌐 Then deploy to Vercel:"
echo "1. Go to vercel.com and connect your GitHub account"
echo "2. Import your zenith repository"
echo "3. Add your environment variables in Vercel dashboard"
echo "4. Deploy!"
echo ""
echo "✨ Your app will be live at: https://your-project.vercel.app"

