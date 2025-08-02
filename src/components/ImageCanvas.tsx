import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import type { PexelsPhoto } from '../types/pexels';

interface ImageCanvasProps {
  photo: PexelsPhoto;
  imageUrl: string;
  onTextElementsChange: (textElements: string[]) => void;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
}

export default function ImageCanvas({ 
  photo, 
  imageUrl, 
  onTextElementsChange, 
  onCanvasReady 
}: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !imageUrl) return;

    setIsLoading(true);
    setError(null);

    try {
      // Initialize Fabric.js canvas
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#1e293b'
      });

      fabricCanvasRef.current = fabricCanvas;

      // Load background image
      fabric.Image.fromURL(imageUrl, (img) => {
        if (!img) {
          setError('Failed to load image');
          setIsLoading(false);
          return;
        }

        // Scale image to fit canvas
        const canvasWidth = 800;
        const canvasHeight = 600;
        const imageAspect = img.width! / img.height!;
        const canvasAspect = canvasWidth / canvasHeight;

        let scaleX, scaleY;
        if (imageAspect > canvasAspect) {
          // Image is wider than canvas
          scaleX = canvasWidth / img.width!;
          scaleY = scaleX;
        } else {
          // Image is taller than canvas
          scaleY = canvasHeight / img.height!;
          scaleX = scaleY;
        }

        img.set({
          scaleX,
          scaleY,
          left: (canvasWidth - img.width! * scaleX) / 2,
          top: (canvasHeight - img.height! * scaleY) / 2,
          selectable: false,
          evented: false
        });

        fabricCanvas.add(img);
        fabricCanvas.sendToBack(img);
        fabricCanvas.renderAll();

        setIsLoading(false);
        
        // Notify parent that canvas is ready
        onCanvasReady(canvasRef.current!);
      }, { crossOrigin: 'anonymous' });

      // Update text elements when canvas changes
      const updateTextElements = () => {
        const textObjects = fabricCanvas.getObjects('text') as fabric.Text[];
        const textElements = textObjects.map(obj => obj.text || '').filter(text => text.trim());
        onTextElementsChange(textElements);
      };

      fabricCanvas.on('object:added', updateTextElements);
      fabricCanvas.on('object:removed', updateTextElements);
      fabricCanvas.on('object:modified', updateTextElements);

    } catch (err) {
      setError('Failed to initialize canvas');
      setIsLoading(false);
    }

    // Cleanup
    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [imageUrl, onTextElementsChange, onCanvasReady]);

  const addText = () => {
    if (!fabricCanvasRef.current) return;

    const text = new fabric.Text('Add your text here', {
      left: 100,
      top: 100,
      fill: '#ffffff',
      fontSize: 24,
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeWidth: 1,
      shadow: 'rgba(0,0,0,0.5) 2px 2px 5px'
    });

    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();
  };

  const addShape = (type: 'rectangle' | 'circle') => {
    if (!fabricCanvasRef.current) return;

    let shape: fabric.Object;

    if (type === 'rectangle') {
      shape = new fabric.Rect({
        left: 150,
        top: 150,
        width: 100,
        height: 60,
        fill: 'rgba(147, 51, 234, 0.7)',
        stroke: '#9333ea',
        strokeWidth: 2
      });
    } else {
      shape = new fabric.Circle({
        left: 150,
        top: 150,
        radius: 50,
        fill: 'rgba(147, 51, 234, 0.7)',
        stroke: '#9333ea',
        strokeWidth: 2
      });
    }

    fabricCanvasRef.current.add(shape);
    fabricCanvasRef.current.setActiveObject(shape);
    fabricCanvasRef.current.renderAll();
  };

  const deleteSelected = () => {
    if (!fabricCanvasRef.current) return;

    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (activeObject) {
      fabricCanvasRef.current.remove(activeObject);
      fabricCanvasRef.current.renderAll();
    }
  };

  const clearCanvas = () => {
    if (!fabricCanvasRef.current) return;

    const objects = fabricCanvasRef.current.getObjects();
    const imageObject = objects.find(obj => obj.type === 'image');
    
    fabricCanvasRef.current.clear();
    
    if (imageObject) {
      fabricCanvasRef.current.add(imageObject);
      fabricCanvasRef.current.sendToBack(imageObject);
    }
    
    fabricCanvasRef.current.renderAll();
  };

  if (error) {
    return (
      <div className="bg-red-950/60 border border-red-500/30 rounded-lg p-6">
        <p className="text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Canvas Controls */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-xl shadow-2xl border border-purple-500/20 p-6">
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={addText}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium transition-all duration-300"
          >
            📝 Add Text
          </button>
          <button
            onClick={() => addShape('rectangle')}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-300"
          >
            ⬜ Rectangle
          </button>
          <button
            onClick={() => addShape('circle')}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition-all duration-300"
          >
            ⭕ Circle
          </button>
          <button
            onClick={deleteSelected}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-all duration-300"
          >
            🗑️ Delete
          </button>
          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg font-medium transition-all duration-300"
          >
            🧹 Clear All
          </button>
        </div>

        <p className="text-sm text-slate-300">
          💡 <strong>Tip:</strong> Double-click text to edit, drag to move, use corners to resize
        </p>
      </div>

      {/* Canvas Container */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-xl shadow-2xl border border-purple-500/20 p-6">
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
                <span className="text-slate-300">Loading image...</span>
              </div>
            </div>
          )}
          
          <canvas 
            ref={canvasRef}
            className="border border-purple-500/30 rounded-lg shadow-lg max-w-full"
          />
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-slate-400">
            Photo by{' '}
            <a 
              href={photo.photographer_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-pink-400 hover:underline"
            >
              {photo.photographer}
            </a>
            {' '}on{' '}
            <a 
              href="https://www.pexels.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-pink-400 hover:underline"
            >
              Pexels
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}