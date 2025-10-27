import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ImageData } from '../types';
import { generateVideoWithPrompt } from '../services/geminiService';
import { UploadIcon, SpinnerIcon, SparklesIcon, ExclamationCircleIcon, VideoCameraIcon } from './icons';

const loadingMessages = [
    "Đang khởi tạo mô hình Veo...",
    "Kịch bản của bạn đang được xử lý...",
    "Các нейрон đang hoạt động hết công suất...",
    "Quá trình này có thể mất vài phút...",
    "Đang render các khung hình đầu tiên...",
    "Sắp xong rồi, đang kiểm tra kết quả...",
];

const VideoGenerator: React.FC = () => {
  const [image, setImage] = useState<ImageData | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [error, setError] = useState<string | null>(null);
  const [isKeySelected, setIsKeySelected] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsKeySelected(hasKey);
      }
      setCheckingKey(false);
    };
    checkKey();
  }, []);

  useEffect(() => {
    if (isLoading) {
      // FIX: The return type of setInterval in the browser is `number`, not `NodeJS.Timeout`.
      const intervalId: number = setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = loadingMessages.indexOf(prev);
          return loadingMessages[(currentIndex + 1) % loadingMessages.length];
        });
      }, 4000);
      return () => clearInterval(intervalId);
    }
  }, [isLoading]);
  
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setIsKeySelected(true); // Giả định thành công để tránh race condition
      setError(null);
    } else {
      setError("Không thể tìm thấy chức năng chọn API Key.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng tải lên tệp hình ảnh hợp lệ.');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        setImage({ dataUrl, base64, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Vui lòng nhập mô tả cho video.');
      return;
    }
    if (!isKeySelected) {
      setError('Vui lòng chọn API Key trước khi tạo video.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);
    setLoadingMessage(loadingMessages[0]);

    try {
      const videoUrl = await generateVideoWithPrompt(
        prompt,
        aspectRatio,
        image ? { base64: image.base64, mimeType: image.mimeType } : undefined
      );
      setGeneratedVideoUrl(videoUrl);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Đã xảy ra lỗi không xác định.';
      setError(errorMessage);
      if (errorMessage.includes("API Key không hợp lệ")) {
        setIsKeySelected(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [prompt, aspectRatio, image, isKeySelected]);

  const ImagePlaceholder: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="w-full h-full bg-white/5 rounded-lg flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/20 hover:border-cyan-400 transition-colors duration-300">
      {children}
      <p className="mt-4 text-sm font-semibold text-gray-400 text-center">{title}</p>
    </div>
  );
  
  if (checkingKey) {
    return (
        <div className="flex justify-center items-center h-96">
            <SpinnerIcon className="w-12 h-12 text-gray-400 animate-spin" />
        </div>
    )
  }

  return (
    <div className="relative">
      {error && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-full max-w-lg p-4 text-sm text-red-200 bg-red-900/80 backdrop-blur-sm rounded-lg shadow-lg z-20 border border-red-700 flex items-center" role="alert">
          <ExclamationCircleIcon className="w-5 h-5 mr-3 flex-shrink-0"/>
          <div><span className="font-medium">Lỗi:</span> {error}</div>
        </div>
      )}
      <div className="space-y-8">
        {!isKeySelected && (
            <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg text-center">
                <p className="font-bold">Cần có hành động</p>
                <p className="text-sm mb-3">Chức năng tạo video Veo yêu cầu bạn phải chọn API Key của riêng mình. Việc sử dụng sẽ được tính phí vào tài khoản Google Cloud của bạn.</p>
                <p className="text-xs mb-4"><a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Tìm hiểu thêm về thanh toán.</a></p>
                <button onClick={handleSelectKey} className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Chọn API Key
                </button>
            </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Input Panel */}
          <div className={`bg-gray-800/50 backdrop-blur-md p-6 rounded-2xl shadow-2xl shadow-black/20 border border-white/10 space-y-6 ${!isKeySelected ? 'opacity-50 pointer-events-none' : ''}`}>
             <h2 className="text-lg font-semibold text-white">1. Tải ảnh bắt đầu (Tùy chọn)</h2>
            <div className="aspect-video w-full">
              {image ? (
                <img src={image.dataUrl} alt="Start" className="w-full h-full object-contain rounded-lg shadow-lg"/>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} className="w-full h-full">
                  <ImagePlaceholder title="Nhấn để tải ảnh lên">
                    <UploadIcon className="w-12 h-12 text-gray-500" />
                  </ImagePlaceholder>
                </button>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden"/>
            {image && (
              <div className="flex items-center justify-center space-x-4 mt-1">
                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors duration-200 px-4 py-1 rounded-full hover:bg-white/10"
                >
                    Đổi ảnh
                </button>
                <button 
                    onClick={() => setImage(null)} 
                    className="text-sm font-medium text-gray-400 hover:text-red-400 transition-colors duration-200 px-4 py-1 rounded-full hover:bg-white/10"
                >
                    Xóa ảnh
                </button>
              </div>
            )}

            <h2 className="text-lg font-semibold text-white pt-4 border-t border-white/10">2. Mô tả video</h2>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="ví dụ: 'Một con mèo phi hành gia đang lướt ván trong vũ trụ'" className="w-full h-24 p-3 bg-gray-900/50 border border-white/20 rounded-md focus:ring-2 focus:ring-cyan-500" disabled={isLoading}/>

            <h2 className="text-lg font-semibold text-white pt-4 border-t border-white/10">3. Chọn tỷ lệ</h2>
            <div className="flex gap-4">
                {(['16:9', '9:16'] as const).map(ratio => (
                    <button key={ratio} onClick={() => setAspectRatio(ratio)} disabled={isLoading} className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${aspectRatio === ratio ? 'bg-cyan-600 text-white' : 'bg-gray-700/50 hover:bg-gray-600/50'}`}>
                        {ratio === '16:9' ? 'Ngang (16:9)' : 'Dọc (9:16)'}
                    </button>
                ))}
            </div>

            <button onClick={handleSubmit} disabled={isLoading || !prompt.trim() || !isKeySelected} className="w-full flex items-center justify-center bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 disabled:from-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 disabled:cursor-not-allowed">
              {isLoading ? <><SpinnerIcon className="animate-spin mr-3 h-5 w-5" /> Đang tạo...</> : <><SparklesIcon className="mr-2 h-5 w-5"/>Tạo Video</>}
            </button>
          </div>

          {/* Output Panel */}
          <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-2xl shadow-2xl shadow-black/20 border border-white/10 h-full flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-6 flex-shrink-0">Kết quả</h2>
            <div className="flex-grow aspect-video w-full">
              {isLoading ? (
                <div className="w-full h-full bg-white/5 rounded-lg flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/20">
                  <SpinnerIcon className="w-12 h-12 text-gray-400 animate-spin" />
                  <p className="mt-4 text-sm font-semibold text-gray-400 text-center">{loadingMessage}</p>
                </div>
              ) : generatedVideoUrl ? (
                <video src={generatedVideoUrl} controls autoPlay loop className="w-full h-full object-contain rounded-lg shadow-lg" />
              ) : (
                <ImagePlaceholder title="Video đã tạo sẽ xuất hiện ở đây">
                  <VideoCameraIcon className="w-12 h-12 text-gray-500" />
                </ImagePlaceholder>
              )}
            </div>
            {/* Thumbnail Preview Section */}
            {!isLoading && generatedVideoUrl && image && (
              <div className="flex-shrink-0 pt-4 mt-4 border-t border-white/10">
                  <p className="text-sm font-medium text-gray-300 mb-2">Ảnh bắt đầu:</p>
                  <div className="w-32 h-auto rounded-lg overflow-hidden border-2 border-white/10 shadow-lg bg-black/20">
                    <img 
                      src={image.dataUrl} 
                      alt="Ảnh bắt đầu" 
                      className="w-full h-full object-contain"
                    />
                  </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;