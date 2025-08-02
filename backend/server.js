import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Upload image to Cloudinary
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'visufix-ai-video',
          transformation: [
            { width: 1024, height: 1024, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    res.json({
      success: true,
      imageUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    });

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload image',
      details: error.message 
    });
  }
});

// Generate AI video using ModelsLab
app.post('/api/generate-video', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        error: 'Missing required field: prompt' 
      });
    }

    if (!process.env.MODELSLAB_API_KEY) {
      return res.status(500).json({ 
        error: 'ModelsLab API key not configured' 
      });
    }

    // Call ModelsLab text2video API
    const modelsLabResponse = await fetch('https://modelslab.com/api/v6/video/text2video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: process.env.MODELSLAB_API_KEY,
        prompt: prompt,
        negative_prompt: "blurry, low quality, distorted, ugly, bad anatomy, extra limbs",
        height: 512,
        width: 512,
        num_frames: 16,
        num_inference_steps: 25,
        guidance_scale: 7.5,
        fps: 8,
        motion_bucket_id: 127,
        noise_aug_strength: 0.02,
        seed: null,
        webhook: null,
        track_id: null
      }),
    });

    if (!modelsLabResponse.ok) {
      const errorData = await modelsLabResponse.text();
      console.error('ModelsLab API error:', errorData);
      
      if (modelsLabResponse.status === 401) {
        return res.status(500).json({ 
          error: 'Invalid ModelsLab API key' 
        });
      }
      
      if (modelsLabResponse.status === 429) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded. Please try again later.' 
        });
      }

      return res.status(500).json({ 
        error: 'Failed to start video generation',
        details: errorData 
      });
    }

    const data = await modelsLabResponse.json();
    
    // Handle both immediate success and processing responses
    if (data.status === 'success') {
      res.json({
        success: true,
        taskId: data.id.toString(),
        status: 'completed',
        videoUrl: data.output?.[0]
      });
    } else if (data.status === 'processing') {
      res.json({
        success: true,
        taskId: data.id.toString(),
        status: 'processing',
        fetchUrl: data.fetch_result
      });
    } else {
      return res.status(500).json({ 
        error: 'Unexpected response from ModelsLab',
        details: data 
      });
    }

  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate video',
      details: error.message 
    });
  }
});

// Check video generation status
app.get('/api/video-status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!process.env.MODELSLAB_API_KEY) {
      return res.status(500).json({ 
        error: 'ModelsLab API key not configured' 
      });
    }

    // Use ModelsLab fetch API to check status
    const response = await fetch(`https://modelslab.com/api/v6/video/fetch/${taskId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: process.env.MODELSLAB_API_KEY
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('ModelsLab status check error:', errorData);
      return res.status(500).json({ 
        error: 'Failed to check video status',
        details: errorData 
      });
    }

    const data = await response.json();
    
    // Map ModelsLab status to our expected format
    let status = 'PENDING';
    let progress = 0;
    let videoUrl = null;
    let error = null;

    if (data.status === 'success') {
      status = 'SUCCEEDED';
      progress = 100;
      videoUrl = data.output?.[0];
    } else if (data.status === 'processing') {
      status = 'RUNNING';
      progress = data.eta ? Math.max(0, 100 - (data.eta / 120 * 100)) : 50; // Estimate progress
    } else if (data.status === 'error') {
      status = 'FAILED';
      error = data.message || 'Video generation failed';
    }
    
    res.json({
      taskId,
      status,
      progress,
      videoUrl,
      error
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      error: 'Failed to check video status',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: error.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 VisuFix AI Video Backend running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🎬 Using ModelsLab for video generation`);
  
  // Check for required environment variables
  if (!process.env.MODELSLAB_API_KEY) {
    console.warn('⚠️  WARNING: MODELSLAB_API_KEY not set. Video generation will fail.');
    console.warn('   Set your ModelsLab API key in .env file');
  }
});