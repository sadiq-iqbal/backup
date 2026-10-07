import { useState, useRef } from 'react';
import { Camera, Loader2, ZoomIn, ZoomOut, Check, X, Move, Eye } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import ImageViewerModal from './ImageViewerModal';

export default function AvatarUpload({
  currentAvatar,
  onAvatarUploaded,
  size = 'w-24 h-24',
  textSize = 'text-3xl',
  userName = '',
  className = '',
}) {
  const { setUser } = useAuth();
  const fileInputRef = useRef(null);
  const cropContainerRef = useRef(null);
  const imageRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Crop Modal state
  const [selectedImage, setSelectedImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // File selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Mouse / Touch drag handlers for positioning inside crop window
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Crop image using HTML5 Canvas & Upload
  const handleCropAndUpload = async () => {
    if (!selectedImage || !imageRef.current) return;

    setUploading(true);
    try {
      const img = imageRef.current;
      const canvas = document.createElement('canvas');
      const CROP_SIZE = 500;
      canvas.width = CROP_SIZE;
      canvas.height = CROP_SIZE;
      const ctx = canvas.getContext('2d');

      // Draw clean white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);

      const frameWidth = cropContainerRef.current?.clientWidth || 224;
      const scaleFactor = CROP_SIZE / frameWidth;

      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;

      // Draw transformed image
      const drawWidth = imgWidth * zoom * scaleFactor;
      const drawHeight = imgHeight * zoom * scaleFactor;
      const drawX = (CROP_SIZE - drawWidth) / 2 + position.x * scaleFactor;
      const drawY = (CROP_SIZE - drawHeight) / 2 + position.y * scaleFactor;

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      // Convert canvas to Blob
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.92)
      );

      const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      const localPreviewUrl = URL.createObjectURL(croppedFile);
      setPreview(localPreviewUrl);
      setSelectedImage(null);

      // Upload file to backend/Cloudinary
      const formData = new FormData();
      formData.append('file', croppedFile);

      const { data } = await api.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const finalAvatar = data.avatar;
      setPreview(finalAvatar);

      if (setUser) {
        setUser((prev) => (prev ? { ...prev, avatar: finalAvatar } : prev));
      }

      if (onAvatarUploaded) {
        onAvatarUploaded(finalAvatar);
      }

      toast.success('Profile picture updated!');
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error(err.response?.data?.error || 'Failed to crop and upload avatar');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const initialLetter = (userName || 'U').charAt(0).toUpperCase();
  const displayAvatar = preview || currentAvatar;

  return (
    <>
      <div className={`relative group inline-block ${className}`}>
        <div
          className={`${size} rounded-2xl bg-brand-100 flex items-center justify-center font-black text-brand-600 shrink-0 ring-4 ring-white shadow-md overflow-hidden relative transition-all duration-200 group-hover:ring-brand-200 aspect-square cursor-pointer`}
          onClick={() => {
            if (displayAvatar && !uploading) setIsViewerOpen(true);
          }}
        >
          {displayAvatar ? (
            <img src={displayAvatar} alt={userName || 'Avatar'} className="w-full h-full object-cover object-center transition-transform duration-200 group-hover:scale-105" />
          ) : (
            <span className={textSize}>{initialLetter}</span>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center text-white z-20">
              <Loader2 size={24} className="animate-spin text-brand-400" />
            </div>
          )}

          {!uploading && (
            <div className="absolute inset-0 bg-gray-950/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white transition-opacity duration-200 z-10 p-1 backdrop-blur-[1px]">
              {displayAvatar && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsViewerOpen(true);
                  }}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                  title="View Profile Photo"
                >
                  <Eye size={18} />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-colors cursor-pointer shadow-md"
                title="Upload / Change Photo"
              >
                <Camera size={18} />
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Full Resolution Image Lightbox Viewer Modal */}
      <ImageViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        src={displayAvatar}
        title={`${userName || 'User'}'s Profile Picture`}
      />

      {/* Compact Interactive Crop & Adjust Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-4 sm:p-5 max-w-xs sm:max-w-sm w-full shadow-2xl space-y-3 sm:space-y-4 border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-gray-950">Crop Profile Photo</h3>
                <p className="text-[11px] text-gray-500 font-medium">Drag to position, scroll/zoom to fit</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Compact Crop Window Container (56 = 224px) */}
            <div
              ref={cropContainerRef}
              className="relative w-56 h-56 mx-auto rounded-2xl overflow-hidden bg-gray-950 shadow-inner cursor-grab active:cursor-grabbing border-2 border-brand-500/40 select-none flex items-center justify-center touch-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
            >
              {/* Circular Overlay Mask */}
              <div className="absolute inset-0 border-[28px] border-black/45 rounded-full pointer-events-none z-10 shadow-lg" />

              <img
                ref={imageRef}
                src={selectedImage}
                alt="Crop preview"
                className="max-w-none transition-transform duration-75 select-none pointer-events-none"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                }}
              />

              <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded-md text-[9px] font-bold flex items-center gap-1 pointer-events-none z-20">
                <Move size={9} /> Drag to adjust
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="space-y-1 px-1">
              <div className="flex items-center justify-between text-[11px] text-gray-500 font-semibold">
                <span className="flex items-center gap-1"><ZoomOut size={12} /> Zoom</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="btn-secondary flex-1 py-2 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropAndUpload}
                disabled={uploading}
                className="btn-primary flex-1 py-2 text-xs font-bold shadow-glow-sm flex items-center justify-center gap-1.5"
              >
                {uploading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <Check size={14} /> Save Photo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
