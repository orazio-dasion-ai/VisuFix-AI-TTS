export class TTSService {
  private synth: SpeechSynthesis | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.synth = window.speechSynthesis || null;
    this.isSupported = !!this.synth && 'speak' in this.synth;
  }

  isWebSpeechSupported(): boolean {
    return this.isSupported;
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.isSupported || !this.synth) return [];
    return this.synth.getVoices();
  }

  speak(text: string, options: {
    rate?: number;
    pitch?: number;
    volume?: number;
    voice?: SpeechSynthesisVoice;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: SpeechSynthesisErrorEvent) => void;
  } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported || !this.synth) {
        reject(new Error('Text-to-speech is not supported in this browser'));
        return;
      }

      if (!text.trim()) {
        reject(new Error('No text provided for speech synthesis'));
        return;
      }

      // Stop any ongoing speech
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set options
      utterance.rate = options.rate ?? 1;
      utterance.pitch = options.pitch ?? 1;
      utterance.volume = options.volume ?? 1;
      
      if (options.voice) {
        utterance.voice = options.voice;
      }

      // Event handlers
      utterance.onstart = () => {
        options.onStart?.();
      };

      utterance.onend = () => {
        options.onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        options.onError?.(event);
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      // Speak the text
      this.synth.speak(utterance);
    });
  }

  stop(): void {
    if (this.isSupported && this.synth) {
      this.synth.cancel();
    }
  }

  pause(): void {
    if (this.isSupported && this.synth) {
      this.synth.pause();
    }
  }

  resume(): void {
    if (this.isSupported && this.synth) {
      this.synth.resume();
    }
  }

  isSpeaking(): boolean {
    if (!this.isSupported || !this.synth) return false;
    return this.synth.speaking;
  }

  isPaused(): boolean {
    if (!this.isSupported || !this.synth) return false;
    return this.synth.paused;
  }
}

// Singleton instance
export const ttsService = new TTSService(); 