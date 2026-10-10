import React from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  description?: string;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  description,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <button
        onClick={onClose}
        className="absolute top-5 right-5 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition focus:outline-hidden"
        aria-label="Close image lightbox"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
        <div className="relative overflow-hidden rounded-2xl shadow-2xl max-h-[75vh]">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-auto max-h-[75vh] object-contain rounded-2xl"
          />
        </div>

        <div className="mt-4 text-center max-w-xl">
          <h3 className="text-white font-display text-lg font-bold">{title}</h3>
          {description && <p className="text-xs sm:text-sm text-slate-300 mt-1">{description}</p>}
        </div>
      </div>
    </div>
  );
};
