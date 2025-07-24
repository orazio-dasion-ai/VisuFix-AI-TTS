export interface RecordingOptions {
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
  mimeType?: string;
  onDataAvailable?: (event: BlobEvent) => void;
  onStart?: () => void;
  onStop?: (blob: Blob) => void;
  onError?: (error: Error) => void;
}

export class VideoRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording: boolean = false;
  private audioContext: AudioContext | null = null;
  private canvasStream: MediaStream | null = null;
  private mixedStream: MediaStream | null = null;

  constructor() {
    // Initialize audio context for potential audio mixing
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new AudioContext();
    }
  }

  /**
   * Check if video recording is supported in the current browser
   */
  isSupported(): boolean {
    return !!(
      typeof window !== 'undefined' &&
      window.MediaRecorder &&
      'captureStream' in HTMLCanvasElement.prototype &&
      window.AudioContext
    );
  }

  /**
   * Get supported MIME types for recording
   */
  getSupportedMimeTypes(): string[] {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4;codecs=h264,aac',
      'video/mp4'
    ];

    return types.filter(type => MediaRecorder.isTypeSupported(type));
  }

  /**
   * Start recording canvas with audio
   */
  async startRecording(
    canvas: HTMLCanvasElement, 
    options: RecordingOptions = {}
  ): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Video recording is not supported in this browser');
    }

    if (this.isRecording) {
      throw new Error('Recording is already in progress');
    }

    try {
      // Clear any previous recording data
      this.recordedChunks = [];

      // Capture canvas stream
      this.canvasStream = canvas.captureStream(30); // 30 FPS

      // Get user's microphone for potential audio capture
      // Note: For TTS, we'll rely on system audio capture
      let audioStream: MediaStream | null = null;
      
      try {
        // Request microphone access (this will capture TTS if it goes through speakers)
        audioStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          } 
        });
      } catch (audioError) {
        console.warn('Could not access microphone for audio recording:', audioError);
        // Continue without audio - canvas-only recording
      }

      // Combine canvas and audio streams
      this.mixedStream = new MediaStream();
      
      // Add video tracks from canvas
      this.canvasStream.getVideoTracks().forEach(track => {
        this.mixedStream!.addTrack(track);
      });

      // Add audio tracks if available
      if (audioStream) {
        audioStream.getAudioTracks().forEach(track => {
          this.mixedStream!.addTrack(track);
        });
      }

      // Configure MediaRecorder
      const supportedTypes = this.getSupportedMimeTypes();
      const mimeType = options.mimeType || supportedTypes[0] || 'video/webm';

      const mediaRecorderOptions: MediaRecorderOptions = {
        mimeType,
        videoBitsPerSecond: options.videoBitsPerSecond || 2500000, // 2.5 Mbps
        audioBitsPerSecond: options.audioBitsPerSecond || 128000,   // 128 kbps
      };

      this.mediaRecorder = new MediaRecorder(this.mixedStream, mediaRecorderOptions);

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
          options.onDataAvailable?.(event);
        }
      };

      this.mediaRecorder.onstart = () => {
        this.isRecording = true;
        options.onStart?.();
        console.log('Video recording started');
      };

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        
        // Create final blob from recorded chunks
        const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        
        options.onStop?.(blob);
        console.log('Video recording stopped, blob size:', blob.size);
        
        // Cleanup
        this.cleanup();
      };

      this.mediaRecorder.onerror = (event) => {
        const error = new Error(`MediaRecorder error: ${event}`);
        options.onError?.(error);
        console.error('Video recording error:', error);
        this.cleanup();
      };

      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms

    } catch (error) {
      this.cleanup();
      throw new Error(`Failed to start recording: ${error}`);
    }
  }

  /**
   * Stop the current recording
   */
  stopRecording(): void {
    if (!this.isRecording || !this.mediaRecorder) {
      console.warn('No active recording to stop');
      return;
    }

    this.mediaRecorder.stop();
  }

  /**
   * Check if currently recording
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Download the recorded video blob as a file
   */
  downloadVideo(blob: Blob, filename: string = 'visufix-video'): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Determine file extension from blob type
    const mimeType = blob.type;
    const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
    a.download = `${filename}.${extension}`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up the object URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    // Stop all tracks
    if (this.canvasStream) {
      this.canvasStream.getTracks().forEach(track => track.stop());
      this.canvasStream = null;
    }

    if (this.mixedStream) {
      this.mixedStream.getTracks().forEach(track => track.stop());
      this.mixedStream = null;
    }

    this.mediaRecorder = null;
    this.isRecording = false;
  }

  /**
   * Dispose of the service and clean up all resources
   */
  dispose(): void {
    this.stopRecording();
    this.cleanup();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const videoRecordingService = new VideoRecordingService(); 