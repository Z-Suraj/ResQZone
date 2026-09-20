import React, { useState } from 'react';

interface AuthoritySectionBackgroundProps {
  imageUrl: string;
  fallbackUrl?: string;
  darkMode: boolean;
  alt?: string;
}

export const AuthoritySectionBackground: React.FC<AuthoritySectionBackgroundProps> = ({
  imageUrl,
  fallbackUrl,
  darkMode,
  alt = 'Emergency Operations Command background',
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
      {/* 1. Base Command Center GIS / Satellite / Disaster Photo */}
      <img
        src={imgSrc}
        alt={alt}
        onError={handleError}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover object-center transform scale-100 transition-all duration-700 brightness-[0.75] contrast-[1.1]"
      />

      {/* 2. Professional Emergency Operations Center (EOC) Subtle Overlay */}
      {/* Retains clear visibility of the background while providing high-contrast readability for glass panels */}
      <div 
        className={`absolute inset-0 transition-colors duration-300 ${
          darkMode 
            ? 'bg-gradient-to-b from-[#090e17]/85 via-[#090e17]/75 to-[#090e17]/90 backdrop-blur-[1px]' 
            : 'bg-gradient-to-b from-slate-100/85 via-white/75 to-slate-200/85 backdrop-blur-[1px]'
        }`} 
      />

      {/* 3. Subtle EOC Tactical Grid Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.35)_100%)]" />
    </div>
  );
};
