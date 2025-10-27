import React, { useState } from 'react';
import ImageEditor from './components/ImageEditor';
import VideoGenerator from './components/VideoGenerator';
import { PhotoIcon, VideoCameraIcon } from './components/icons';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'image' | 'video'>('image');

  const getButtonClass = (tool: 'image' | 'video') => {
    const baseClass = "flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transform transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]";
    if (activeTool === tool) {
      return `${baseClass} bg-cyan-600 text-white shadow-md`;
    }
    return `${baseClass} text-gray-300 hover:bg-gray-700/50`;
  };

  return (
    <div className="min-h-screen text-gray-100 font-sans">
      <header className="bg-gray-900/50 backdrop-blur-lg border-b border-white/10 sticky top-0 z-20 transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                TDX Creative Studio
              </h1>
            </div>
          </div>
        </div>
      </header>
      <main>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-sm mx-auto mb-8">
            <div className="bg-gray-800/50 p-1 rounded-lg flex space-x-1 border border-white/10">
              <button onClick={() => setActiveTool('image')} className={getButtonClass('image')}>
                <PhotoIcon className="w-5 h-5 mr-2" />
                Chỉnh sửa ảnh
              </button>
              <button onClick={() => setActiveTool('video')} className={getButtonClass('video')}>
                <VideoCameraIcon className="w-5 h-5 mr-2" />
                Tạo Video
              </button>
            </div>
          </div>
          {activeTool === 'image' ? <ImageEditor /> : <VideoGenerator />}
        </div>
      </main>
      <footer className="text-center py-6 mt-8 border-t border-white/10">
        <p className="text-sm text-gray-400">Hỗ trợ bởi Gemini và Veo AI</p>
      </footer>
    </div>
  );
};

export default App;