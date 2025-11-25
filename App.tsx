import React, { useState } from 'react';
import { TreeScene } from './components/TreeScene';

const App: React.FC = () => {
  const [treeCount, setTreeCount] = useState<number>(1);

  return (
    <div className="w-full h-screen relative bg-white flex flex-col items-center justify-center font-sans">
      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-100 w-64">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <label htmlFor="tree-count" className="text-sm font-semibold text-gray-700">Tree Count</label>
            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">{treeCount}</span>
          </div>
          <input
            id="tree-count"
            type="range"
            min="1"
            max="100"
            step="1"
            value={treeCount}
            onChange={(e) => setTreeCount(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500 hover:accent-green-600 transition-all"
          />
          <p className="text-xs text-gray-400">Drag slider to plant more trees</p>
        </div>
      </div>

      {/* 3D Scene */}
      <div className="w-full h-full">
        <TreeScene treeCount={treeCount} />
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 px-4 text-center text-gray-400 text-xs pointer-events-none select-none">
        Drag to rotate • Scroll to zoom • Recreation of provided image
      </div>
    </div>
  );
};

export default App;