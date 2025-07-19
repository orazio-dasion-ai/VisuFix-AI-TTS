import { useState, useRef, useEffect } from 'react'
import { Canvas, Image as FabricImage } from 'fabric'
import axios from 'axios'

// Types
interface PexelsImage {
  id: number
  src: {
    medium: string
    large: string
  }
  alt: string
}

interface PexelsResponse {
  photos: PexelsImage[]
}

function App() {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [canvas, setCanvas] = useState<Canvas | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (canvasRef.current && !canvas) {
      const fabricCanvas = new Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#f0f0f0'
      })
      setCanvas(fabricCanvas)

      // Cleanup on unmount
      return () => {
        fabricCanvas.dispose()
      }
    }
  }, [canvas])

  // Pexels API search function
  const searchImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a search prompt')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Using Pexels API with dummy key - replace with actual key in production
      const response = await axios.get<PexelsResponse>(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(prompt)}&per_page=1`,
        {
          headers: {
            'Authorization': 'YOUR_PEXELS_API_KEY_HERE' // Replace with actual API key
          }
        }
      )

      if (response.data.photos.length === 0) {
        setError('No images found for that prompt. Try something else?')
        return
      }

      const image = response.data.photos[0]
      loadImageToCanvas(image.src.large, image.alt)

    } catch (err) {
      console.error('Error fetching image:', err)
      setError('Something went wrong fetching the image. Check your connection or try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  // Load image into Fabric.js canvas
  const loadImageToCanvas = (imageUrl: string, altText: string) => {
    if (!canvas) return

    FabricImage.fromURL(imageUrl, (img) => {
      // Clear existing content
      canvas.clear()

      // Scale image to fit canvas while maintaining aspect ratio
      const canvasWidth = canvas.getWidth() || 800
      const canvasHeight = canvas.getHeight() || 600
      
      const imgAspectRatio = img.width! / img.height!
      const canvasAspectRatio = canvasWidth / canvasHeight

      let newWidth, newHeight

      if (imgAspectRatio > canvasAspectRatio) {
        // Image is wider than canvas
        newWidth = canvasWidth
        newHeight = canvasWidth / imgAspectRatio
      } else {
        // Image is taller than canvas
        newHeight = canvasHeight
        newWidth = canvasHeight * imgAspectRatio
      }

      img.scaleToWidth(newWidth)
      img.scaleToHeight(newHeight)

      // Center the image
      img.set({
        left: (canvasWidth - newWidth) / 2,
        top: (canvasHeight - newHeight) / 2,
        selectable: false,
        evented: false
      })

      canvas.add(img)
      canvas.renderAll()
    }, { crossOrigin: 'anonymous' })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            VisuFix AI TTS
          </h1>
          <p className="text-gray-600">
            Create visual content with AI-generated voiceovers
          </p>
        </div>

        {/* Prompt Input Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a prompt (e.g., 'Cornell student in the library')"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && searchImage()}
            />
            <button
              onClick={searchImage}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Searching...' : 'Search Image'}
            </button>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Canvas Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              className="border border-gray-300 rounded-lg"
            />
          </div>
          
          {/* Canvas Instructions */}
          <div className="mt-4 text-center text-gray-600">
            {!canvas?.getObjects().length ? (
              <p>Search for an image to start editing</p>
            ) : (
              <p>Image loaded! Editing tools coming in Part 2...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
