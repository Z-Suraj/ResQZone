import React, { useState, useEffect } from 'react';
import { ImageOff, ShieldAlert, Navigation, Home, AlertTriangle } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  category?: 'disaster' | 'rescue' | 'shelter' | 'transport' | 'community' | 'default';
  priority?: boolean;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  fallbackSrc,
  alt,
  className = '',
  category = 'default',
  priority = false,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(src);
  const [hasError, setHasError] = useState<boolean>(false);
  const [triedFallback, setTriedFallback] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
    setTriedFallback(false);
    setLoaded(false);

    if (priority && src) {
      const preloadImg = new Image();
      preloadImg.src = src;
    }
  }, [src, priority]);

  const handleError = () => {
    if (!triedFallback && fallbackSrc && fallbackSrc !== imgSrc) {
      setTriedFallback(true);
      setImgSrc(fallbackSrc);
    } else {
      setHasError(true);
    }
  };

  if (hasError || !imgSrc) {
    // Render semantic high-contrast emergency placeholder instead of broken image icon
    const getCategoryIcon = () => {
      switch (category) {
        case 'disaster':
          return <AlertTriangle className="w-8 h-8 text-rose-500 mb-2" />;
        case 'rescue':
          return <ShieldAlert className="w-8 h-8 text-amber-500 mb-2" />;
        case 'shelter':
          return <Home className="w-8 h-8 text-emerald-500 mb-2" />;
        case 'transport':
          return <Navigation className="w-8 h-8 text-sky-500 mb-2" />;
        default:
          return <ShieldAlert className="w-8 h-8 text-slate-400 mb-2" />;
      }
    };

    return (
      <div 
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-slate-300 p-4 border border-slate-700/50 select-none overflow-hidden relative ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" />
        <div className="relative z-10 flex flex-col items-center text-center">
          {getCategoryIcon()}
          <span className="text-xs font-semibold text-slate-200 line-clamp-1 max-w-[90%]">{alt}</span>
          <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-mono">ResQZone Asset</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-slate-800/80 animate-pulse flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-slate-500 border-t-amber-500 rounded-full animate-spin" />
        </div>
      )}
      <img
        src={imgSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        {...props}
      />
    </div>
  );
};
