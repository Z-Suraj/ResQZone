import React, { useState } from 'react';

interface CitizenSectionBackgroundProps {
  imageUrl: string;
  fallbackUrl?: string;
  darkMode: boolean;
  alt?: string;
}

export const CitizenSectionBackground: React.FC<CitizenSectionBackgroundProps> = ({
  imageUrl,
  fallbackUrl,
  darkMode,
  alt = 'Emergency section background',
}) => {
  const [imgSrc, setImgSrc] = useState(imageUrl);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError && fallbackUrl && imgSrc !== fallbackUrl) {
      setImgSrc(fallbackUrl);
      setHasError(true);
    }
  };

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Base Image Layer (Crisp, full-bleed cover photo without crippling parent opacity) */}
      <img
        src={imgSrc}
        alt={alt}
        onError={handleError}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover object-center transform scale-100 transition-all duration-700 brightness-95 contrast-105"
      />

      {/* 2. Semi-Transparent Gradient Overlay for Content Legibility */}
      <div 
        className={`absolute inset-0 transition-colors duration-300 ${
          darkMode 
            ? 'bg-gradient-to-b from-[#090e17]/80 via-[#090e17]/65 to-[#090e17]/85 backdrop-blur-[0.5px]' 
            : 'bg-gradient-to-b from-slate-50/80 via-white/65 to-slate-100/80 backdrop-blur-[0.5px]'
        }`} 
      />
    </div>
  );
};
