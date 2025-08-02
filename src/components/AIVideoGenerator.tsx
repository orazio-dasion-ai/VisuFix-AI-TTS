import React, { useState, useRef, useCallback } from 'react';
import { generateVideo, validatePrompt, enhancePrompt, VideoGenerationPoller } from '../services/runwayApi';
import type { GeneratedVideo, VideoStatusResponse } from '../types/aiVideo';

interface AIVideoGeneratorProps {
  className?: string;
}

export default function AIVideoGenerator({ className = '' }: AIVideoGeneratorProps) {
  // Main state
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Video generation polling
  const pollerRef = useRef<VideoGenerationPoller | null>(null);



  // Video generation handlers
  const handleGenerateVideo = async () => {
    const promptError = validatePrompt(prompt);
    if (promptError) {
      setError(promptError);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Generate video with ModelsLab (text-only)
      const enhancedPrompt = enhancePrompt(prompt);
      const response = await generateVideo({
        prompt: enhancedPrompt
      });

      // Create new video entry
      const newVideo: GeneratedVideo = {
        id: Date.now().toString(),
        taskId: response.taskId,
        prompt: enhancedPrompt,
        status: 'generating',
        progress: 0,
        createdAt: new Date()
      };

      setGeneratedVideos(prev => [newVideo, ...prev]);

      // Start polling for completion
      pollerRef.current = new VideoGenerationPoller();
      
      try {
        await pollerRef.current.pollUntilComplete(
          response.taskId,
          (status: VideoStatusResponse) => {
            setGeneratedVideos(prev => prev.map(video => 
              video.taskId === response.taskId 
                ? {
                    ...video,
                    progress: status.progress,
                    status: status.status === 'SUCCEEDED' ? 'completed' : 
                            status.status === 'FAILED' ? 'failed' : 'generating',
                    videoUrl: status.videoUrl,
                    error: status.error
                  }
                : video
            ));
          }
        );
      } catch (pollError) {
        setGeneratedVideos(prev => prev.map(video => 
          video.taskId === response.taskId 
            ? {
                ...video,
                status: 'failed',
                error: pollError instanceof Error ? pollError.message : 'Generation failed'
              }
            : video
        ));
      }

    } catch (error) {
      console.error('Video generation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate video');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadVideo = (videoUrl: string, prompt: string) => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `visufix-ai-video-${Date.now()}.mp4`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegenerateVideo = (video: GeneratedVideo) => {
    // Set the same prompt for regeneration
    setPrompt(video.prompt);
  };

  // Calculate character count for prompt
  const characterCount = prompt.length;
  const isPromptValid = characterCount > 0 && characterCount <= 500;
  const canGenerate = isPromptValid && !isGenerating;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-xl shadow-2xl border border-purple-500/20 p-6">
        <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          🎬 AI Video Generator
        </h2>
        <p className="text-slate-300">
          Describe your vision and watch AI bring it to life! Create stunning videos from just text descriptions.
        </p>
      </div>

      {/* Prompt Input */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-xl shadow-2xl border border-purple-500/20 p-6">
        <h3 className="text-lg font-semibold mb-4 text-slate-200">Describe Your Video</h3>
        <div className="space-y-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to see in the video... (e.g., 'A majestic eagle soaring over snow-capped mountains at sunset, cinematic, high quality' or 'A bustling city street at night with neon lights reflecting on wet pavement')"
            className="w-full h-32 px-4 py-3 bg-slate-800/80 border border-purple-500/30 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 resize-none"
            maxLength={500}
          />
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-400">
              💡 <strong>Tip:</strong> Be specific about scenes, movement, lighting, and style for best results
            </div>
            <div className={`text-sm ${
              characterCount > 450 ? 'text-red-400' : 
              characterCount > 400 ? 'text-amber-400' : 
              'text-slate-400'
            }`}>
              {characterCount}/500
            </div>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-xl shadow-2xl border border-purple-500/20 p-6">
        <button
          onClick={handleGenerateVideo}
          disabled={!canGenerate}
          className={`w-full py-4 px-6 rounded-lg font-medium transition-all duration-300 ${
            canGenerate
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25'
              : 'bg-slate-700/50 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isGenerating ? '🎬 Crafting your cinematic moment...' : '🎬 Generate AI Video'}
        </button>
        
        {!isPromptValid && (
          <p className="text-sm text-slate-400 mt-2 text-center">Add a description to generate your video</p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-950/60 border border-red-500/30 rounded-lg backdrop-blur-md shadow-lg p-4">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Generated Videos */}
      {generatedVideos.length > 0 && (
        <div className="bg-slate-900/60 backdrop-blur-md rounded-xl shadow-2xl border border-purple-500/20 p-6">
          <h3 className="text-lg font-semibold mb-4 text-slate-200">Generated Videos</h3>
                        <div className="space-y-4">
            {generatedVideos.map((video) => (
              <div key={video.id} className="bg-slate-800/40 rounded-lg p-4 border border-purple-500/30">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                    <span className="text-2xl">🎬</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-slate-200 font-medium line-clamp-2">{video.prompt}</p>
                    <div className="flex items-center gap-3">
                      {video.status === 'generating' && (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                          <span className="text-sm text-purple-300">Generating... {video.progress}%</span>
                        </div>
                      )}
                      {video.status === 'completed' && video.videoUrl && (
                        <div className="flex gap-2">
                          <video
                            src={video.videoUrl}
                            className="w-32 h-20 rounded object-cover"
                            controls
                            muted
                          />
                          <button
                            onClick={() => handleDownloadVideo(video.videoUrl!, video.prompt)}
                            className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded text-sm font-medium transition-all duration-300"
                          >
                            📥 Download
                          </button>
                          <button
                            onClick={() => handleRegenerateVideo(video)}
                            className="px-3 py-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded text-sm font-medium transition-all duration-300"
                          >
                            🔄 Regenerate
                          </button>
                        </div>
                      )}
                      {video.status === 'failed' && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-red-300">❌ Failed: {video.error}</span>
                          <button
                            onClick={() => handleRegenerateVideo(video)}
                            className="px-3 py-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded text-sm font-medium transition-all duration-300"
                          >
                            🔄 Try Again
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}