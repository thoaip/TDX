import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ImageData } from '../types';
import { editImageWithPrompt } from '../services/geminiService';
import { UploadIcon, PhotoIcon, SpinnerIcon, SparklesIcon, ExclamationCircleIcon, DownloadIcon } from './icons';

const samplePrompts = [
  'Biến thành tranh vẽ màu nước',
  'Thêm hiệu ứng ánh sáng neon',
  'Xóa phông nền',
  'Chuyển sang ảnh đen trắng',
];

const ImageEditor: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng tải lên tệp hình ảnh hợp lệ (PNG, JPG, v.v.).');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        setOriginalImage({ dataUrl, base64, mimeType: file.type });
        setEditedImage(null); // Clear previous edit on new image upload
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = useCallback(async () => {
    if (!originalImage || !prompt.trim()) {
      setError('Vui lòng tải ảnh lên và nhập mô tả chỉnh sửa.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      const newImageBase64 = await editImageWithPrompt(
        originalImage.base64,
        originalImage.mimeType,
        prompt
      );
      setEditedImage(`data:image/png;base64,${newImageBase64}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đã xảy ra lỗi không xác định.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt]);

  const ImagePlaceholder: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="w-full h-full bg-white/5 rounded-lg flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/20 hover:border-cyan-400 transition-all duration-300 group-hover:scale-[1.02]">
      {children}
      <p className="mt-4 text-sm font-semibold text-gray-400 text-center">{title}</p>
    </div>
  );

  return (
    <div className="relative">
      {error && (
        <div className="animate-fadeIn absolute -top-4 left-1/2 -translate-x-1/2 w-full max-w-lg p-4 text-sm text-red-200 bg-red-900/80 backdrop-blur-sm rounded-lg shadow-lg z-20 border border-red-700 flex items-center" role="alert">
          <ExclamationCircleIcon className="w-5 h-5 mr-3 flex-shrink-0"/>
          <div><span className="font-medium">Lỗi:</span> {error}</div>
        </div>
      )}
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Input Panel */}
          <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-2xl shadow-2xl shadow-black/20 border border-white/10 space-y-6">
            <h2 className="text-lg font-semibold text-white">1. Tải ảnh lên</h2>
            <div className="aspect-video w-full">
              {originalImage ? (
                <img src={originalImage.dataUrl} alt="Original" className="w-full h-full object-contain rounded-lg shadow-lg"/>
              ) : (
                <button onClick={handleUploadClick} className="w-full h-full group">
                  <ImagePlaceholder title="Nhấn để tải ảnh lên">
                    <UploadIcon className="w-12 h-12 text-gray-500 transition-transform duration-300 group-hover:scale-110" />
                  </ImagePlaceholder>
                </button>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            {originalImage && (
              <button onClick={handleUploadClick} className="w-full text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors duration-200">
                Đổi ảnh khác
              </button>
            )}
            
            <h2 className="text-lg font-semibold text-white pt-4 border-t border-white/10">2. Mô tả yêu cầu chỉnh sửa</h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="ví dụ: 'Thêm bộ lọc retro', 'Làm mờ hậu cảnh', 'Xoá người ở bên trái'"
              className="w-full h-24 p-3 bg-gray-900/50 border border-white/20 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-gray-200 placeholder-gray-500 resize-none"
              disabled={isLoading}
            />
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-400 self-center">Gợi ý:</span>
              {samplePrompts.map((sample) => (
                <button
                  key={sample}
                  onClick={() => setPrompt(sample)}
                  disabled={isLoading}
                  className="px-3 py-1 bg-gray-700/50 hover:bg-cyan-900/50 text-cyan-300 text-xs font-medium rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                >
                  {sample}
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading || !originalImage || !prompt.trim()}
              className="w-full flex items-center justify-center bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 shadow-lg disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <SparklesIcon className="-ml-1 mr-2 h-5 w-5"/>
                  Tạo ảnh
                </>
              )}
            </button>
          </div>

          {/* Output Panel */}
          <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-2xl shadow-2xl shadow-black/20 border border-white/10 h-full flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-6">Kết quả</h2>
            <div className="aspect-video w-full">
              {isLoading ? (
                  <div className="w-full h-full bg-white/5 rounded-lg flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/20">
                    <SpinnerIcon className="w-12 h-12 text-gray-400 animate-spin" />
                    <p className="mt-4 text-sm font-semibold text-gray-400">Đang chỉnh sửa...</p>
                  </div>
                ) : editedImage ? (
                  <img src={editedImage} key={editedImage} alt="Edited" className="w-full h-full object-contain rounded-lg shadow-lg animate-fadeIn"/>
                ) : (
                  <ImagePlaceholder title="Ảnh đã chỉnh sửa sẽ xuất hiện ở đây">
                    <PhotoIcon className="w-12 h-12 text-gray-500" />
                  </ImagePlaceholder>
                )}
            </div>
            {editedImage && !isLoading && (
              <div className="mt-6 text-center">
                <a
                  href={editedImage}
                  download="tdx-edited-image.png"
                  className="inline-flex items-center justify-center bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500 shadow-lg"
                >
                  <DownloadIcon className="-ml-1 mr-2 h-5 w-5"/>
                  Tải ảnh
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;