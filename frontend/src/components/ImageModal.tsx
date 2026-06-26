import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export default function ImageModal({ isOpen, imageUrl, onClose }: ImageModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-10 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <button 
        className="absolute top-4 right-4 md:top-8 md:right-8 text-white hover:text-slate-300 transition-colors p-2 bg-black/50 rounded-full"
        onClick={onClose}
        aria-label="ปิด"
      >
        <X size={32} />
      </button>
      <img 
        src={imageUrl} 
        alt="Full screen preview" 
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl scale-95 animate-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
      />
    </div>
  );
}
