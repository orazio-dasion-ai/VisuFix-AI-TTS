interface VideoRecordingOptions {
  onStart?: () => void;
  onStop?: (blob: Blob) => void;
  onError?: (error: Error) => void;
}

class VideoRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'MediaRecorder' in window &&
      'getDisplayMedia' in navigator.mediaDevices
    );
  }

  async startRecording(canvas: HTMLCanvasElement, options: VideoRecordingOptions = {}): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Video recording not supported in this browser');
    }

    try {
      // Get canvas stream
      this.stream = canvas.captureStream(30); // 30 FPS
      
      if (!this.stream) {
        throw new Error('Failed to capture canvas stream');
      }

      // Initialize MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      this.recordedChunks = [];

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstart = () => {
        options.onStart?.();
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        options.onStop?.(blob);
        this.cleanup();
      };

      this.mediaRecorder.onerror = (event) => {
        const error = new Error(`Recording error: ${(event as any).error}`);
        options.onError?.(error);
        this.cleanup();
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second

    } catch (error) {
      const recordingError = new Error(
        `Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      options.onError?.(recordingError);
      throw recordingError;
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
  }

  downloadVideo(blob: Blob, filename: string = 'recording'): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  get isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}

export const videoRecordingService = new VideoRecordingService();