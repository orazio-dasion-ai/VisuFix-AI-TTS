# 🎬 VisuFix AI Video Setup Guide

This guide will help you set up the complete VisuFix AI Video platform with Runway Gen-2 integration.

## 📋 Prerequisites

- **Node.js** 18+ installed
- **Runway API Key** ([Get one here](https://app.runwayml.com/account))
- **Cloudinary Account** ([Sign up here](https://cloudinary.com/))
- **Pexels API Key** (already included in the code)

---

## 🚀 Quick Start

### 1. **Clone & Install Frontend**

```bash
# Install frontend dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### 2. **Setup Backend**

```bash
# Navigate to backend directory
cd backend

# Install backend dependencies  
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your API keys (see below)
nano .env
```

### 3. **Configure API Keys**

Edit `backend/.env` with your credentials:

```env
PORT=3001

# Get from https://app.runwayml.com/account
RUNWAY_API_KEY=your_actual_runway_key

# Get from https://console.cloudinary.com/
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. **Start Backend**

```bash
# In the backend directory
npm run dev
```

The backend will run on `http://localhost:3001`

---

## 🎯 How to Use

### **Canvas Editor Tab** 🎨
- Search for images using Pexels
- Add text, shapes, and customize
- Generate TTS voiceovers
- Record canvas as MP4

### **AI Video Tab** 🎬  
- **Upload Image**: Drag & drop or browse for local images
- **From Pexels**: Search and select from stock photos
- **Add Prompt**: Describe what you want to happen (300 chars max)
- **Generate**: Create cinematic AI videos using Runway Gen-2
- **Download**: Save generated videos as MP4

---

## ⚙️ API Configuration Details

### **Runway API Setup**
1. Visit [Runway Account](https://app.runwayml.com/account)
2. Generate an API key  
3. Add to `backend/.env` as `RUNWAY_API_KEY`

**Pricing**: Runway charges per video generation (~$0.05-0.15 per video)

### **Cloudinary Setup**
1. Create account at [Cloudinary](https://cloudinary.com/)
2. Go to [Console Dashboard](https://console.cloudinary.com/)
3. Copy Cloud Name, API Key, and API Secret
4. Add all three to `backend/.env`

**Free Tier**: 25 credits/month (plenty for testing)

---

## 🛠️ Development

### **Project Structure**
```
visufix-ai-tts/
├── src/
│   ├── components/
│   │   ├── ImageCanvas.tsx      # Canvas editor
│   │   └── AIVideoGenerator.tsx # AI video interface  
│   ├── services/
│   │   ├── pexelsApi.ts        # Image search
│   │   ├── runwayApi.ts        # Video generation
│   │   └── cloudinaryUpload.ts # Image hosting
│   └── types/
│       ├── pexels.ts           # Image types
│       └── aiVideo.ts          # Video types
├── backend/
│   ├── server.js               # Express API server
│   └── package.json            # Backend dependencies
└── package.json                # Frontend dependencies
```

### **Available Scripts**

**Frontend:**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

**Backend:**
```bash
npm run dev      # Start with nodemon (auto-reload)
npm start        # Start production server
```

---

## 🚀 Deployment

### **Frontend** (Vercel/Netlify)
1. Push code to GitHub
2. Connect to Vercel/Netlify
3. Set build command: `npm run build`
4. Set output directory: `dist`

### **Backend** (Railway/Render/Heroku)
1. Deploy the `backend/` folder
2. Set environment variables in hosting platform
3. Update frontend API URL in production

---

## 🐛 Troubleshooting

### **Common Issues:**

**❌ "Runway API key not configured"**
- Check `backend/.env` has correct `RUNWAY_API_KEY`
- Restart backend server after adding env vars

**❌ "Failed to upload image"**  
- Verify Cloudinary credentials in `backend/.env`
- Check file size < 10MB and valid image format

**❌ "CORS errors"**
- Make sure backend is running on port 3001
- Check frontend is making requests to correct API URL

**❌ "Video generation timeout"**
- Runway videos take 30-60 seconds to generate
- Check Runway account has sufficient credits

---

## 💡 Tips & Best Practices

### **For Best Video Results:**
- Use high-quality source images (1024x1024+ recommended)
- Write detailed, specific prompts
- Include cinematic keywords: "4K", "cinematic", "professional lighting"
- Keep prompts under 300 characters

### **Example Prompts:**
```
"A peaceful student walking through Cornell's campus in autumn, cinematic, 4K"
"Gentle camera push-in on coffee shop, warm lighting, cozy atmosphere"  
"Time-lapse of city skyline at sunset, golden hour, cinematic movement"
```

---

## 📞 Support

If you encounter issues:
1. Check the [Runway API docs](https://docs.runwayml.com/)
2. Verify [Cloudinary setup](https://cloudinary.com/documentation)
3. Check browser console for error messages
4. Ensure all API keys are correctly configured

---

🎉 **You're all set!** Start creating amazing AI videos with VisuFix!