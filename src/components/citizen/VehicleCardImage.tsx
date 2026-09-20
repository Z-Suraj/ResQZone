import React, { useState } from 'react';
import {
  Bus,
  Train,
  Car,
  Ship,
  Plane,
  Footprints,
  Ambulance as AmbulanceIcon,
  Truck,
  AlertCircle
} from 'lucide-react';
import { SupportedVehicleType, VEHICLE_TYPE_LABELS } from '../../data/vehicleImages';

interface VehicleCardImageProps {
  type: SupportedVehicleType;
  image: string | null;
  alt: string;
  className?: string;
  darkMode?: boolean;
}

export const VehicleCardImage: React.FC<VehicleCardImageProps> = ({
  type,
  image,
  alt,
  className = '',
  darkMode = true,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Return appropriate Lucide vehicle icon
  const renderVehicleIcon = (sizeClass = 'w-6 h-6') => {
    switch (type) {
      case 'bus':
        return <Bus className={`${sizeClass} text-blue-500`} />;
      case 'train':
        return <Train className={`${sizeClass} text-indigo-500`} />;
      case 'car':
        return <Car className={`${sizeClass} text-amber-500`} />;
      case 'rescue_vehicle':
        return <Truck className={`${sizeClass} text-orange-500`} />;
      case 'ambulance':
        return <AmbulanceIcon className={`${sizeClass} text-rose-500`} />;
      case 'boat':
        return <Ship className={`${sizeClass} text-cyan-500`} />;
      case 'helicopter':
        return <Plane className={`${sizeClass} text-purple-500`} />;
      case 'walking':
        return <Footprints className={`${sizeClass} text-emerald-500`} />;
      default:
        return <Bus className={`${sizeClass} text-blue-500`} />;
    }
  };

  // 1. Walking mode: STRICT SPEC: "Walking → NO vehicle image; use an appropriate walking/person icon"
  if (type === 'walking') {
    return (
      <div 
        className={`relative w-full h-full flex flex-col items-center justify-center p-4 select-none ${
          darkMode 
            ? 'bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 text-emerald-300 border border-emerald-800/30' 
            : 'bg-gradient-to-br from-emerald-50 via-slate-100 to-emerald-100/60 text-emerald-800 border border-emerald-200'
        } ${className}`}
        aria-label="Walking evacuation route"
      >
        <div className={`p-3 rounded-full mb-2 ${
          darkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-200 text-emerald-800'
        }`}>
          {renderVehicleIcon('w-7 h-7')}
        </div>
        <span className="text-xs font-black tracking-wider uppercase">
          Walking Evacuation
        </span>
        <span className={`text-[10px] mt-0.5 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          On Foot Escort &bull; No Vehicle Required
        </span>
      </div>
    );
  }

  // 2. Clean vehicle-type placeholder if image is missing or failed to load
  // STRICT SPEC:
  // [Vehicle Icon]
  // Bus
  // or:
  // [Vehicle Icon]
  // Rescue Vehicle
  // Do NOT show an unrelated image. Never display a broken image.
  if (!image || hasError) {
    const label = VEHICLE_TYPE_LABELS[type] || 'Vehicle';
    return (
      <div 
        className={`relative w-full h-full flex flex-col items-center justify-center p-4 text-center select-none ${
          darkMode 
            ? 'bg-slate-900/90 text-slate-200 border border-slate-800' 
            : 'bg-slate-100 text-slate-800 border border-slate-200'
        } ${className}`}
        role="img"
        aria-label={`${label} placeholder`}
      >
        <div className={`p-3 rounded-xl mb-1.5 shadow-sm ${
          darkMode ? 'bg-slate-800/80' : 'bg-white'
        }`}>
          {renderVehicleIcon('w-7 h-7')}
        </div>
        <span className="text-xs font-bold tracking-wide">
          {label}
        </span>
        <span className={`text-[9px] font-mono mt-0.5 ${
          darkMode ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Evacuation Asset
        </span>
      </div>
    );
  }

  // 3. Realistic photograph rendering with error boundary & smooth load
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Skeleton / Placeholder while loading */}
      {!isLoaded && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center animate-pulse ${
          darkMode ? 'bg-slate-800/80 text-slate-400' : 'bg-slate-200 text-slate-500'
        }`}>
          {renderVehicleIcon('w-5 h-5 opacity-60')}
          <span className="text-[10px] font-medium mt-1">Loading photo...</span>
        </div>
      )}

      <img
        src={image}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover object-center transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
