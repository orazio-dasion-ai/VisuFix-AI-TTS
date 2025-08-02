import React, { useState } from 'react';
import ImageCanvas from './components/ImageCanvas';
import AIVideoGenerator from './components/AIVideoGenerator';
import { searchImages, getOptimalImageUrl, PexelsApiError } from './services/pexelsApi';
import { ttsService } from './services/ttsService';
import { videoRecordingService } from './services/videoRecordingService';
import type { PexelsPhoto } from './types/pexels';

type AppTab = 'canvas' | 'ai-video';

function App() {
  // Tab state
  const [activeTab, setActiveTab] = useState<AppTab>('canvas');
  
  // Canvas tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPhoto, setCurrentPhoto] = useState<PexelsPhoto | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [textElements, setTextElements] = useState<string[]>([]);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [ttsStatus, setTtsStatus] = useState<'idle' | 'playing' | 'stopped'>('idle');
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'processing'>('idle');

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search term');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const photos = await searchImages(searchQuery);
      const photo = photos[0];
      const imageUrl = getOptimalImageUrl(photo);
      
      setCurrentPhoto(photo);
      setCurrentImageUrl(imageUrl);
    } catch (err) {
      if (err instanceof PexelsApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleTTSPlay = async () => {
    if (textElements.length === 0) {
      setError('No text elements found. Add some text to the canvas first!');
      return;
    }

    if (!ttsService.isWebSpeechSupported()) {
      setError('Text-to-speech is not supported in your browser.');
      return;
    }

    setTtsStatus('playing');
    setCurrentTextIndex(0);

    try {
      // Read each text element in sequence
      for (let i = 0; i < textElements.length; i++) {
        setCurrentTextIndex(i);
        
        await ttsService.speak(textElements[i], {
          rate: 1,
          pitch: 1,
          volume: 0.8,
          onStart: () => {
            console.log(`Reading text ${i + 1}/${textElements.length}: ${textElements[i]}`);
          },
          onEnd: () => {
            console.log(`Finished reading text ${i + 1}`);
          },
          onError: (error: Error) => {
            console.error('TTS Error:', error);
            setError('Error during text-to-speech playback.');
          }
        });

        // Small pause between text elements
        if (i < textElements.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      setTtsStatus('idle');
      setCurrentTextIndex(0);
    } catch (error) {
      console.error('TTS Error:', error);
      setError('Error during text-to-speech playback.');
      setTtsStatus('idle');
    }
  };

  const handleTTSStop = () => {
    if (ttsService.isWebSpeechSupported()) {
      window.speechSynthesis.cancel();
    }
    setTtsStatus('stopped');
    setCurrentTextIndex(0);
  };

  const handlePlayTTS = () => {
    if (ttsStatus === 'playing') {
      handleTTSStop();
    } else {
      handleTTSPlay();
    }
  };

  const handleDownloadMP4 = async () => {
    if (!canvasElement) {
      setError('Canvas not ready. Please wait for the image to load.');
      return;
    }

    if (textElements.length === 0) {
      setError('No text elements found. Add some text to create a video with voiceover.');
      return;
    }

    if (!videoRecordingService.isSupported()) {
      setError('Video recording is not supported in your browser. Please try Chrome, Firefox, or Edge.');
      return;
    }

    if (recordingStatus === 'recording' || recordingStatus === 'processing') {
      return; // Already in progress
    }

    try {
      setRecordingStatus('recording');
      setError(null);

      // Start video recording
      await videoRecordingService.startRecording(canvasElement, {
        onStart: () => {
          console.log('Recording started, beginning TTS playback...');
        },
        onStop: (blob: Blob) => {
          setRecordingStatus('processing');
          console.log('Recording completed, preparing download...');
          
          // Generate filename with timestamp
          const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
          const filename = `visufix-video-${timestamp}`;
          
          // Download the video
          videoRecordingService.downloadVideo(blob, filename);
          
          setRecordingStatus('idle');
        },
        onError: (error: Error) => {
          setError(`Recording failed: ${error.message}`);
          setRecordingStatus('idle');
        }
      });

      // Small delay to ensure recording has started
      await new Promise(resolve => setTimeout(resolve, 500));

      // Start TTS playback while recording
      await handleTTSPlay();

      // Small delay after TTS completes before stopping recording
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Stop recording
      videoRecordingService.stopRecording();

    } catch (error) {
      console.error('MP4 download error:', error);
      setError(`Failed to create video: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setRecordingStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md shadow-2xl border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">VisuFix AI TTS</h1>
              <p className="text-sm text-slate-300">Create images, add text & generate voiceovers or cinematic AI videos</p>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex items-center gap-6">
              <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('canvas')}
                  className={`py-2 px-4 rounded-md font-medium transition-all duration-300 ${
                    activeTab === 'canvas'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  🎨 Canvas Editor
                </button>
                <button
                  onClick={() => setActiveTab('ai-video')}
                  className={`py-2 px-4 rounded-md font-medium transition-all duration-300 ${
                    activeTab === 'ai-video'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  🎬 AI Video
                </button>
              </div>
              
              {/* Canvas-specific buttons */}
              {activeTab === 'canvas' && (
                <div className="flex gap-3">
              <button
                onClick={handlePlayTTS}
                disabled={textElements.length === 0 || loading}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                  ttsStatus === 'playing'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25'
                    : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg shadow-purple-500/25 disabled:bg-slate-700/50 disabled:cursor-not-allowed'
                }`}
              >
                {ttsStatus === 'playing' ? '⏹️ Stop TTS' : '🔊 Play TTS'}
              </button>
              <button
                onClick={handleDownloadMP4}
                disabled={!currentPhoto || textElements.length === 0 || recordingStatus !== 'idle'}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 disabled:bg-slate-700/50 disabled:cursor-not-allowed ${
                  recordingStatus === 'recording' 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white animate-pulse shadow-lg shadow-red-500/25'
                    : recordingStatus === 'processing'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/25'
                    : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-500/25'
                }`}
              >
                {recordingStatus === 'recording' 
                  ? '🔴 Recording...' 
                  : recordingStatus === 'processing'
                  ? '⚙️ Processing...'
                  : '📥 Download MP4'
                }
              </button>
                </div>
              )}
            </div>
          </div>
      </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Canvas Tab Content */}
        {activeTab === 'canvas' && (
          <>
            {/* Search Section */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-xl shadow-2xl border border-purple-500/20 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">🔍 Search for an Image</h2>
          <div className="flex gap-4">
                          <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your search prompt (e.g., 'sunset over mountains', 'modern office space')"
                className="flex-1 px-4 py-2 bg-slate-800/80 border border-purple-500/30 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 backdrop-blur-sm shadow-inner"
                disabled={loading}
              />
                          <button
                onClick={handleSearch}
                disabled={loading || !searchQuery.trim()}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium transition-all duration-300 shadow-lg shadow-purple-500/25 disabled:bg-slate-700/50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Search'}
        </button>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-950/60 border border-red-500/30 rounded-lg backdrop-blur-md shadow-lg">
              <p className="text-red-200">{error}</p>
            </div>
          )}
        </div>

        {/* Canvas Section */}
        {currentPhoto && currentImageUrl ? (
          <div className="space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-md rounded-xl shadow-2xl border border-purple-500/20 p-6">
              <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">🎨 Edit Your Image</h2>
              <p className="text-slate-300 mb-4">
                Add text, shapes, and customize your image. Then use the TTS feature to create a voiceover!
              </p>
            </div>
            <ImageCanvas 
              photo={currentPhoto} 
              imageUrl={currentImageUrl} 
              onTextElementsChange={setTextElements}
              onCanvasReady={setCanvasElement}
            />
            
            {/* TTS Status Section */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-xl shadow-2xl border border-purple-500/20 p-6">
              <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">🔊 Text-to-Speech Status</h2>
              
              {/* Text Elements Display */}
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-3 text-slate-200">Canvas Text Elements ({textElements.length})</h3>
                {textElements.length === 0 ? (
                  <div className="p-4 bg-slate-800/40 rounded-lg border-2 border-dashed border-purple-500/30">
                    <p className="text-slate-400 text-center">
                      📝 No text elements found. Add some text to the canvas first!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {textElements.map((text, index) => (
                      <div 
                        key={index}
                        className={`p-4 rounded-lg border transition-all duration-300 ${
                          ttsStatus === 'playing' && index === currentTextIndex
                            ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-400/50 shadow-lg shadow-purple-500/25 transform scale-[1.02]'
                            : 'bg-slate-800/40 border-purple-500/30 hover:bg-slate-700/50 hover:border-purple-400/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-medium px-2.5 py-0.5 rounded-full shadow-sm">
                            {index + 1}
                          </span>
                          {ttsStatus === 'playing' && index === currentTextIndex && (
                            <span className="flex items-center gap-1 text-purple-300 font-medium text-sm">
                              <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
                              Now reading
                            </span>
                          )}
                          <span className={`flex-1 ${
                            ttsStatus === 'playing' && index === currentTextIndex 
                              ? 'font-medium text-white' 
                              : 'text-slate-200'
                          }`}>
                            {text}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

                             {/* TTS Status Indicator */}
               {ttsStatus === 'playing' && textElements.length > 0 && (
                 <div className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-400/50 shadow-lg">
                   <div className="flex gap-1">
                     <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce"></div>
                     <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                     <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                   </div>
                   <span className="text-slate-200 font-medium">
                     Playing text {currentTextIndex + 1} of {textElements.length}
                   </span>
                 </div>
               )}

                             {/* Browser Support Info */}
               {!ttsService.isWebSpeechSupported() && (
                 <div className="mt-4 p-4 bg-amber-950/60 border border-amber-500/30 rounded-lg backdrop-blur-md shadow-lg">
                   <p className="text-amber-200">
                     ⚠️ Text-to-speech is not supported in your browser. Please try Chrome, Firefox, or Safari.
                   </p>
                 </div>
               )}
             </div>

                           {/* Video Recording Status */}
              {recordingStatus !== 'idle' && (
                <div className="mt-6 bg-slate-900/60 backdrop-blur-md rounded-xl shadow-2xl border border-purple-500/20 p-6">
                  <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">🎬 Video Recording Status</h2>
                 
                                   {recordingStatus === 'recording' && (
                    <div className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-red-950/60 to-red-900/40 rounded-lg border border-red-500/30 shadow-lg">
                      <div className="flex gap-1">
                        <div className="w-3 h-3 bg-gradient-to-r from-red-400 to-red-500 rounded-full animate-pulse"></div>
                        <div className="w-3 h-3 bg-gradient-to-r from-red-400 to-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-3 h-3 bg-gradient-to-r from-red-400 to-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                      <span className="text-red-200 font-medium">
                        🔴 Recording in progress... Please wait for TTS to complete.
                      </span>
                    </div>
                  )}

                                   {recordingStatus === 'processing' && (
                    <div className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-amber-950/60 to-amber-900/40 rounded-lg border border-amber-500/30 shadow-lg">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-400"></div>
                      <span className="text-amber-200 font-medium">
                        ⚙️ Processing video... Your download will start shortly.
                      </span>
                    </div>
                  )}

                                                     <div className="mt-4 p-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-400/50 shadow-lg">
                    <p className="text-slate-200 text-sm">
                      <strong>💡 Tip:</strong> The video will include your canvas with TTS audio. 
                      Make sure your speakers are on and the volume is appropriate for recording.
                    </p>
                  </div>
               </div>
             )}
           </div>
        ) : (
          <div className="bg-slate-900/60 backdrop-blur-md rounded-xl shadow-2xl border border-purple-500/20 p-12 text-center">
            <div className="text-6xl mb-4">🖼️</div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">No image selected</h3>
            <p className="text-slate-300">Search for an image above to get started with your creation!</p>
          </div>
        )}
          </>
        )}

        {/* AI Video Tab Content */}
        {activeTab === 'ai-video' && (
          <AIVideoGenerator />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/80 backdrop-blur-md border-t border-purple-500/20 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-slate-300">
            Made with ❤️ | Images powered by{' '}
            <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-pink-400 hover:underline transition-colors">
              Pexels
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App; 