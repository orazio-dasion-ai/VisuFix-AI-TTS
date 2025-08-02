# VisuFix AI Video Backend

Express.js backend server for AI video generation using Runway Gen-2 API and Cloudinary image hosting.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit with your API keys
nano .env

# Start development server
npm run dev
```

## 📡 API Endpoints

### `POST /api/upload-image`
Upload image to Cloudinary for AI video generation.

**Request:** `multipart/form-data` with `image` file
**Response:** 
```json
{
  "success": true,
  "imageUrl": "https://res.cloudinary.com/...",
  "publicId": "visufix-ai-video/...",
  "width": 1024,
  "height": 1024
}
```

### `POST /api/generate-video`
Start AI video generation with Runway Gen-2.

**Request:**
```json
{
  "imageUrl": "https://res.cloudinary.com/...",
  "prompt": "A peaceful student walking through campus..."
}
```

**Response:**
```json
{
  "success": true,
  "taskId": "gen_abc123",
  "status": "processing"
}
```

### `GET /api/video-status/:taskId`
Check AI video generation progress.

**Response:**
```json
{
  "taskId": "gen_abc123",
  "status": "SUCCEEDED",
  "progress": 100,
  "videoUrl": "https://storage.googleapis.com/..."
}
```

## 🔧 Environment Variables

Required in `.env`:

```env
RUNWAY_API_KEY=your_runway_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 🛠️ Development

```bash
npm run dev      # Start with nodemon (auto-reload)
npm start        # Start production server
```

## 🚀 Deployment

Deploy to Railway, Render, or Heroku:

1. Set environment variables in hosting platform
2. Deploy from this `backend/` directory
3. Update frontend API URL to match deployed backend URL