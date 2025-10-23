import React, { useRef, useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Pencil, 
  Square, 
  Circle, 
  Type,
  Eraser,
  Download,
  Trash2
} from 'lucide-react';

interface DigitalWhiteboardProps {
  sessionId: string;
}

export const DigitalWhiteboard: React.FC<DigitalWhiteboardProps> = ({ sessionId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'shape'>('pen');
  const [color, setColor] = useState('#000000');

  const tools = [
    { id: 'pen', icon: Pencil, label: 'Pen' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'square', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'text', icon: Type, label: 'Text' },
  ];

  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Digital Whiteboard
        </h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-2">
            {tools.map((t) => {
              const Icon = t.icon;
              return (
                <Button
                  key={t.id}
                  variant={tool === t.id ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setTool(t.id as any)}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              );
            })}
          </div>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

          <div className="flex items-center space-x-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded border-2 ${
                  color === c ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="relative bg-white rounded-lg border-2 border-gray-300 dark:border-gray-600" style={{ height: '500px' }}>
          <canvas
            ref={canvasRef}
            className="w-full h-full rounded-lg"
            style={{ touchAction: 'none' }}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400">
              <div className="text-6xl mb-4">✏️</div>
              <p className="text-lg font-medium">Collaborative Whiteboard</p>
              <p className="text-sm mt-2">
                Draw, sketch, and brainstorm with your team in real-time
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
