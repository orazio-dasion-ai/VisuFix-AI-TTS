# VisuFix AI TTS 🎨🔊

A modern React application that combines image search, visual editing, and text-to-speech to create engaging multimedia content.

## ✨ Features

### Part 1: Prompt to Image Search
- 🔍 Search images using natural language prompts
- 🖼️ Powered by Pexels API with high-quality photos
- 🎯 Optimized for landscape orientation (800x600 canvas)
- ⚡ Smart error handling for API limits and network issues

### Part 2: Visual Editing with Fabric.js
- 🎨 Interactive 800x600 canvas for image editing
- ✏️ Add and customize text elements (font size, color)
- 🔷 Add shapes (rectangles, circles) with styling options
- 🎭 Adjust opacity, colors, and borders
- 📐 Drag, resize, and position elements freely

### Part 3: Text-to-Speech Integration
- 🔊 **Smart Text Extraction** - Automatically detects all text elements on canvas
- 🎙️ **Sequential Reading** - Reads text elements in creation order with visual indicators
- ⏯️ **Real-time Controls** - Play/Stop with live progress tracking
- 📱 **Status Dashboard** - Shows current reading progress and text elements
- 🎵 **Visual Feedback** - Animated indicators show which text is being read
- 🌐 **Browser Support** - Works with Web Speech API in modern browsers
- 🌐 Browser compatibility detection and graceful fallbacks

### Part 4: MP4 Video Export
- 🎬 **Real-time Recording** - Uses MediaRecorder API to capture canvas + TTS audio
- 📹 **High Quality Output** - Records at 30 FPS with 2.5 Mbps video quality
- 🎵 **Perfect Audio Sync** - Captures TTS playback with visual highlighting
- 📱 **Browser-based Processing** - No server required, works entirely in browser
- 💾 **Auto-download** - Generates timestamped filename and downloads automatically
- 🎭 **Visual Recording Status** - Shows recording progress with animated indicators

### Bonus Features
- 📱 Modern, responsive Tailwind UI with real-time "●live" indicators
- 🎭 Smooth animations with bouncing dots, pulse effects, and scale transforms
- 📊 Visual progress tracking with numbered text elements
- 🔄 **Smart Button States** - Buttons update based on content and recording status
- 🙏 Proper Pexels photographer attribution
- ⚠️ Comprehensive error handling and user feedback

## 🎬 How to Use

1. **Search for an image** using natural language prompts
2. **Add text elements** by clicking "Add Text" and double-clicking to edit
3. **Customize styling** with real-time font size and color controls  
4. **Add shapes** (rectangles/circles) with fill and border options
5. **Play TTS** to hear your text elements read aloud in sequence
6. **Download MP4** to create a video with synchronized TTS voiceover
7. **Watch the magic** as the app records your canvas with perfect audio sync!

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- A Pexels API key (free at [pexels.com/api](https://www.pexels.com/api/))
- Modern browser (Chrome, Firefox, or Edge) for video recording
- Microphone permission for MP4 export (captures TTS audio)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo>
   cd VisuFix-AI-TTS
   npm install
   ```

2. **Configure Pexels API:**
   - Get your free API key from [pexels.com/api](https://www.pexels.com/api/)
   - Open `src/services/pexelsApi.ts`
   - Replace `'YOUR_PEXELS_API_KEY_HERE'` with your actual API key

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Navigate to `http://localhost:3000`
   - Start creating!

## 🎯 How to Use

1. **Search for an image:** Enter a prompt like "sunset over mountains" or "modern office space"
2. **Edit your canvas:** Add text, shapes, and customize styling using the toolbar
3. **Generate voiceover:** Click "Play TTS" to hear all text elements spoken aloud
4. **Export (coming soon):** The "Download MP4" button will export your creation as video

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Canvas:** Fabric.js
- **Images:** Pexels API
- **TTS:** Web Speech API
- **Development:** ESLint + Hot reload

## 🔧 Project Structure

```
src/
├── components/
│   └── ImageCanvas.tsx       # Main canvas editing component
├── services/
│   ├── pexelsApi.ts         # Image search service
│   └── ttsService.ts        # Text-to-speech service
├── types/
│   └── pexels.ts            # TypeScript types
├── App.tsx                  # Main application component
├── main.tsx                 # React entry point
└── index.css                # Tailwind styles
```

## 🎨 Canvas Controls

- **Add Text:** Creates editable text elements
- **Add Rectangle/Circle:** Insert shapes with customizable styling
- **Delete Selected:** Remove the currently selected element
- **Style Controls:** Adjust font size, colors, opacity in real-time
- **Apply Buttons:** Update selected elements with new styling

## 🔊 TTS Features

- Automatically extracts all text from canvas elements
- Uses browser's native speech synthesis
- Supports different browsers (Chrome, Firefox, Safari)
- Real-time play/stop controls
- Error handling for unsupported browsers

## 🚧 Roadmap

- [ ] Real canvas text extraction for TTS
- [ ] Video export with synchronized voiceover
- [ ] Multiple voice options and speech controls
- [ ] Image upload functionality
- [ ] Advanced text formatting
- [ ] Animation effects
- [ ] Cloud storage integration

## 🤝 Contributing

This is an MVP built for rapid iteration. Feel free to:
- Add new features
- Improve the UI/UX
- Optimize performance
- Add tests

---

**Made with ❤️ | Powered by Pexels**