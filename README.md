# VisuFix-AI-TTS

A React application for creating visual content with AI-generated voiceovers. Built with Vite, TypeScript, Tailwind CSS, and Fabric.js.

## Features (Part 1 - MVP)

- **Image Search**: Search for images using the Pexels API based on text prompts
- **Canvas Editor**: Load images directly into a Fabric.js canvas for editing
- **Modern UI**: Clean, responsive interface built with Tailwind CSS

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Get Pexels API Key**:
   - Sign up at [Pexels API](https://www.pexels.com/api/)
   - Replace `YOUR_PEXELS_API_KEY_HERE` in `src/App.tsx` with your actual API key

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to the URL shown in the terminal

## Usage

1. Enter a search prompt (e.g., "Cornell student in the library")
2. Click "Search Image" to fetch and display an image
3. The image will be loaded into the canvas for editing (Part 2 coming soon!)

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Canvas**: Fabric.js
- **HTTP Client**: Axios
- **Image API**: Pexels

## Coming Soon (Parts 2-4)

- Text and shape editing tools
- Text-to-speech generation
- Video export functionality
