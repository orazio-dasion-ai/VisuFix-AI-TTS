import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import type { PexelsPhoto } from '../types/pexels';

interface ImageCanvasProps {
  photo: PexelsPhoto | null;
  imageUrl: string | null;
  onTextElementsChange?: (textElements: string[]) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export default function ImageCanvas({ photo, imageUrl, onTextElementsChange, onCanvasReady }: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  // Note: selectedTool state is planned for future tool selection UI
  // const [selectedTool, setSelectedTool] = useState<'text' | 'rectangle' | 'circle' | 'select'>('select');
  const [textSize, setTextSize] = useState(24);
  const [textColor, setTextColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#ff0000');
  const [borderColor, setBorderColor] = useState('#000000');
  const [opacity, setOpacity] = useState(1);

  // Function to extract all text elements from canvas
  const extractTextElements = (): string[] => {
    if (!fabricCanvasRef.current) return [];
    
    const textElements: string[] = [];
    const objects = fabricCanvasRef.current.getObjects();
    
    // Filter for text objects and extract their text content
    objects.forEach((obj) => {
      if (obj.type === 'i-text' || obj.type === 'text') {
        const textObj = obj as fabric.IText;
        const text = textObj.text?.trim();
        if (text && text !== 'Double click to edit') {
          textElements.push(text);
        }
      }
    });
    
    return textElements;
  };

  // Notify parent component when text elements change
  const updateTextElements = () => {
    if (onTextElementsChange) {
      const textElements = extractTextElements();
      onTextElementsChange(textElements);
    }
  };

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f3f4f6',
    });

    fabricCanvasRef.current = canvas;

    // Notify parent that canvas is ready
    if (onCanvasReady && canvasRef.current) {
      onCanvasReady(canvasRef.current);
    }

    // Handle selection changes for real-time sidebar sync
    canvas.on('selection:created', (options: any) => {
      const selectedObject = options.selected?.[0];
      if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
        const textObj = selectedObject as fabric.IText;
        setTextSize(textObj.fontSize || 24);
        setTextColor(textObj.fill as string || '#000000');
      } else if (selectedObject && (selectedObject.type === 'rect' || selectedObject.type === 'circle')) {
        setFillColor(selectedObject.fill as string || '#ff0000');
        setBorderColor(selectedObject.stroke as string || '#000000');
        setOpacity(selectedObject.opacity || 1);
      }
    });

    canvas.on('selection:updated', (options: any) => {
      const selectedObject = options.selected?.[0];
      if (selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text')) {
        const textObj = selectedObject as fabric.IText;
        setTextSize(textObj.fontSize || 24);
        setTextColor(textObj.fill as string || '#000000');
      } else if (selectedObject && (selectedObject.type === 'rect' || selectedObject.type === 'circle')) {
        setFillColor(selectedObject.fill as string || '#ff0000');
        setBorderColor(selectedObject.stroke as string || '#000000');
        setOpacity(selectedObject.opacity || 1);
      }
    });

    // Handle text editing completion to update sidebar
    canvas.on('text:editing:exited', (options: any) => {
      const textObj = options.target as fabric.IText;
      if (textObj) {
        setTextSize(textObj.fontSize || 24);
        setTextColor(textObj.fill as string || '#000000');
        // Update text elements when editing ends
        updateTextElements();
      }
    });

    // Cleanup
    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  // Load image when imageUrl changes
  useEffect(() => {
    if (!fabricCanvasRef.current || !imageUrl) return;

    const canvas = fabricCanvasRef.current;
    
    fabric.Image.fromURL(imageUrl, (img: any) => {
      // Clear canvas
      canvas.clear();
      canvas.backgroundColor = '#f3f4f6';

      // Scale image to fit canvas while maintaining aspect ratio
      const canvasWidth = 800;
      const canvasHeight = 600;
      const imgWidth = img.width!;
      const imgHeight = img.height!;

      const scaleX = canvasWidth / imgWidth;
      const scaleY = canvasHeight / imgHeight;
      const scale = Math.min(scaleX, scaleY);

      img.scale(scale);
      img.set({
        left: (canvasWidth - imgWidth * scale) / 2,
        top: (canvasHeight - imgHeight * scale) / 2,
        selectable: false,
        evented: false,
      });

      canvas.add(img);
      canvas.sendToBack(img);
      canvas.renderAll();
    }, {
      crossOrigin: 'anonymous'
    });
  }, [imageUrl]);

  const addText = () => {
    if (!fabricCanvasRef.current) return;

    // Use IText for editable text - double-click editing is built-in!
    const text = new fabric.IText('Double click to edit', {
      left: 100,
      top: 100,
      fontSize: textSize,
      fill: textColor,
      fontFamily: 'Arial',
      lockUniScaling: true, // Prevent text stretching
      editable: true, // Enable editing
    });

    // Handle text scaling by converting to font size changes
    text.on('scaling', () => {
      const newFontSize = Math.max(8, Math.min(300, Math.round(text.fontSize! * text.scaleX!)));
      text.set({
        fontSize: newFontSize,
        scaleX: 1,
        scaleY: 1,
      });
      
      // Update sidebar to reflect new font size
      setTextSize(newFontSize);
      fabricCanvasRef.current?.renderAll();
    });

    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();
    
    // Update text elements when new text is added
    updateTextElements();
  };

  const addRectangle = () => {
    if (!fabricCanvasRef.current) return;

    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 150,
      height: 100,
      fill: fillColor,
      stroke: borderColor,
      strokeWidth: 2,
      opacity: opacity,
    });

    fabricCanvasRef.current.add(rect);
    fabricCanvasRef.current.setActiveObject(rect);
    fabricCanvasRef.current.renderAll();
  };

  const addCircle = () => {
    if (!fabricCanvasRef.current) return;

    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      radius: 50,
      fill: fillColor,
      stroke: borderColor,
      strokeWidth: 2,
      opacity: opacity,
    });

    fabricCanvasRef.current.add(circle);
    fabricCanvasRef.current.setActiveObject(circle);
    fabricCanvasRef.current.renderAll();
  };

  const deleteSelected = () => {
    if (!fabricCanvasRef.current) return;

    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (activeObject && activeObject.type !== 'image') {
      fabricCanvasRef.current.remove(activeObject);
      fabricCanvasRef.current.renderAll();
    }
  };

  // Real-time text property updates
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (activeObject && (activeObject.type === 'text' || activeObject.type === 'i-text')) {
      (activeObject as fabric.IText).set({
        fontSize: textSize,
        fill: textColor,
      });
      fabricCanvasRef.current.renderAll();
    }
  }, [textSize, textColor]);

  // Real-time shape property updates
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (activeObject && (activeObject.type === 'rect' || activeObject.type === 'circle')) {
      activeObject.set({
        fill: fillColor,
        stroke: borderColor,
        opacity: opacity,
      });
      fabricCanvasRef.current.renderAll();
    }
  }, [fillColor, borderColor, opacity]);

  return (
    <div className="flex gap-6">
      {/* Toolbar */}
      <div className="w-64 bg-slate-900/60 backdrop-blur-md rounded-xl shadow-2xl border border-purple-500/20 p-4 h-fit">
        <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Tools</h3>
        
        {/* Tool Selection */}
        <div className="space-y-2 mb-6">
          <button
            onClick={addText}
            className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg shadow-purple-500/25"
          >
            Add Text
          </button>
          <button
            onClick={addRectangle}
            className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 shadow-lg shadow-indigo-500/25"
          >
            Add Rectangle
          </button>
          <button
            onClick={addCircle}
            className="w-full px-4 py-2 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded hover:from-violet-700 hover:to-violet-800 transition-all duration-300 shadow-lg shadow-violet-500/25"
          >
            Add Circle
          </button>
          <button
            onClick={deleteSelected}
            className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg shadow-red-500/25"
          >
            Delete Selected
          </button>
        </div>

        {/* Text Controls */}
        <div className="space-y-4 mb-6">
          <h4 className="font-medium text-slate-200">Text Style <span className="text-xs text-emerald-400">●live</span></h4>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Font Size</label>
            <input
              type="range"
              min="12"
              max="72"
              value={textSize}
              onChange={(e) => setTextSize(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
            <span className="text-sm text-slate-400">{textSize}px</span>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Text Color</label>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-full h-8 rounded border border-purple-500/30 bg-slate-800/80"
            />
          </div>
          
        </div>

        {/* Shape Controls */}
        <div className="space-y-4">
          <h4 className="font-medium text-slate-200">Shape Style <span className="text-xs text-emerald-400">●live</span></h4>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Fill Color</label>
            <input
              type="color"
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              className="w-full h-8 rounded border border-purple-500/30 bg-slate-800/80"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Border Color</label>
            <input
              type="color"
              value={borderColor}
              onChange={(e) => setBorderColor(e.target.value)}
              className="w-full h-8 rounded border border-purple-500/30 bg-slate-800/80"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
            <span className="text-sm text-slate-400">{Math.round(opacity * 100)}%</span>
          </div>
          
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <div className="bg-slate-900/60 backdrop-blur-md rounded-xl shadow-2xl border border-purple-500/20 p-4">
          <canvas ref={canvasRef} className="border border-purple-500/30 rounded shadow-lg" />
          {photo && (
            <p className="text-sm text-slate-300 mt-2">
              Photo by <a href={photo.photographer_url} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-pink-400 hover:underline transition-colors">{photo.photographer}</a> on Pexels
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 