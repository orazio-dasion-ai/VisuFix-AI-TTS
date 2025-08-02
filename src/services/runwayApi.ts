import type { 
  AIVideoGenerationRequest, 
  AIVideoGenerationResponse, 
  VideoStatusResponse
} from '../types/aiVideo';
import { AIVideoError } from '../types/aiVideo';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.com/api' 
  : 'http://localhost:3001/api';

export async function generateVideo(request: AIVideoGenerationRequest): Promise<AIVideoGenerationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new AIVideoError(
        errorData.error || `Video generation failed with status ${response.status}`,
        response.status
      );
    }

    const data: AIVideoGenerationResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Video generation error:', error);
    
    if (error instanceof AIVideoError) {
      throw error;
    }
    
    throw new AIVideoError(
      error instanceof Error 
        ? `Failed to generate video: ${error.message}`
        : 'Failed to start video generation'
    );
  }
}

export async function checkVideoStatus(taskId: string): Promise<VideoStatusResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/video-status/${taskId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new AIVideoError(
        errorData.error || `Status check failed with status ${response.status}`,
        response.status
      );
    }

    const data: VideoStatusResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Video status check error:', error);
    
    if (error instanceof AIVideoError) {
      throw error;
    }
    
    throw new AIVideoError(
      error instanceof Error 
        ? `Failed to check video status: ${error.message}`
        : 'Failed to check video generation status'
    );
  }
}

export function validatePrompt(prompt: string): string | null {
  if (!prompt.trim()) {
    return 'Please enter a description for your video';
  }

  if (prompt.length > 500) {
    return 'Description must be 500 characters or less';
  }

  if (prompt.length < 10) {
    return 'Description must be at least 10 characters long';
  }

  return null; // No validation errors
}

export function enhancePrompt(prompt: string): string {
  // Add cinematic enhancement keywords if not already present
  const cinematicKeywords = ['cinematic', '4K', 'high quality', 'professional', 'beautiful lighting', 'detailed', 'realistic'];
  const lowerPrompt = prompt.toLowerCase();
  
  const hascinematicKeywords = cinematicKeywords.some(keyword => 
    lowerPrompt.includes(keyword.toLowerCase())
  );

  if (!hascinematicKeywords) {
    return `${prompt}, cinematic, high quality, detailed`;
  }

  return prompt;
}

// Polling utility for video generation
export class VideoGenerationPoller {
  private intervalId: number | null = null;
  private isPolling = false;

  async pollUntilComplete(
    taskId: string,
    onUpdate: (status: VideoStatusResponse) => void,
    intervalMs: number = 3000
  ): Promise<VideoStatusResponse> {
    return new Promise((resolve, reject) => {
      this.isPolling = true;
      
      const poll = async () => {
        try {
          const status = await checkVideoStatus(taskId);
          onUpdate(status);

          if (status.status === 'SUCCEEDED') {
            this.stopPolling();
            resolve(status);
          } else if (status.status === 'FAILED') {
            this.stopPolling();
            reject(new AIVideoError(status.error || 'Video generation failed'));
          } else if (!this.isPolling) {
            // Polling was stopped externally
            reject(new AIVideoError('Video generation was cancelled'));
          } else {
            // Continue polling
            this.intervalId = window.setTimeout(poll, intervalMs);
          }
        } catch (error) {
          this.stopPolling();
          reject(error);
        }
      };

      // Start first poll immediately
      poll();
    });
  }

  stopPolling(): void {
    this.isPolling = false;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  get isCurrentlyPolling(): boolean {
    return this.isPolling;
  }
}