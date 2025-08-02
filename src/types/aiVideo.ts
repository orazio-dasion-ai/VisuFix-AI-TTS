export interface AIVideoGenerationRequest {
  prompt: string;
}

export interface AIVideoGenerationResponse {
  success: boolean;
  taskId: string;
  status: 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface VideoStatusResponse {
  taskId: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  progress: number;
  videoUrl?: string;
  error?: string;
}

export interface CloudinaryUploadResponse {
  success: boolean;
  imageUrl: string;
  publicId: string;
  width: number;
  height: number;
  error?: string;
}

export interface GeneratedVideo {
  id: string;
  taskId: string;
  prompt: string;
  videoUrl?: string;
  status: 'generating' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  error?: string;
}

export class AIVideoError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'AIVideoError';
  }
}

export type ImageSource = 'upload' | 'pexels';

export interface ImageSelection {
  url: string;
  source: ImageSource;
  file?: File;
  pexelsPhoto?: any; // PexelsPhoto type from existing types
}

// Optional interface - keeping for potential future image-to-video features
export interface ModelsLabVideoRequest {
  key: string;
  prompt: string;
  negative_prompt?: string;
  height?: number;
  width?: number;
  num_frames?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  fps?: number;
  motion_bucket_id?: number;
  noise_aug_strength?: number;
  seed?: number | null;
  webhook?: string | null;
  track_id?: string | null;
}