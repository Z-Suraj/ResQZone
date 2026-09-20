import React from 'react';

export interface ResQZoneLogoProps {
  variant?: 'symbol' | 'horizontal' | 'stacked' | 'badge';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  theme?: 'dark' | 'light' | 'auto';
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
  subtext?: string;
}

/**
 * Official ResQZone Brand Logo Component
 * Renders the official brand identity with shield, location pin,
 * mountain peaks, safe river route, emergency radio waves, and signature typography.
 */
export const ResQZoneLogo: React.FC<ResQZoneLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  theme = 'auto',
  showTagline = true,
  className = '',
  onClick,
  subtext,
}) => {
  // Size presets for different contexts
  const sizeMap = {
    symbol: {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16',
      hero: 'w-24 h-24 sm:w-28 sm:h-28',
    },
    horizontal: {
      xs: 'h-7',
      sm: 'h-9',
      md: 'h-11',
      lg: 'h-14',
      xl: 'h-16',
      hero: 'h-20 sm:h-24',
    },
    stacked: {
      xs: 'w-24',
      sm: 'w-32',
      md: 'w-44',
      lg: 'w-56',
      xl: 'w-64',
      hero: 'w-72 sm:w-80',
    },
    badge: {
      xs: 'h-7',
      sm: 'h-9',
      md: 'h-11',
      lg: 'h-13',
      xl: 'h-16',
      hero: 'h-20',
    },
  };

  const symbolAsset = '/assets/logo/resqzone-symbol.svg';
  const logoStacked = '/assets/logo/resqzone-logo.svg';
  const logoHorizontalDark = '/assets/logo/resqzone-logo-horizontal.svg';
  const logoHorizontalLight = '/assets/logo/resqzone-logo-horizontal-light.svg';

  // If user requested symbol only (e.g. collapsed sidebar, tiny app icon, quick status button)
  if (variant === 'symbol') {
    return (
      <div 
        onClick={onClick}
        className={`inline-flex items-center justify-center shrink-0 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
        role="img"
        aria-label="ResQZone Official Emblem"
      >
        <img
          src={symbolAsset}
          alt="ResQZone Shield"
          className={`${sizeMap.symbol[size]} object-contain drop-shadow-md transition-transform duration-200 hover:scale-105`}
          loading="eager"
        />
      </div>
    );
  }

  // If user requested stacked format (e.g. login hero, loading screen, about modal)
  if (variant === 'stacked') {
    return (
      <div 
        onClick={onClick}
        className={`inline-flex flex-col items-center justify-center text-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
        role="img"
        aria-label="ResQZone - Safer People. Safer Communities."
      >
        <img
          src={logoStacked}
          alt="ResQZone Official Logo"
          className={`${sizeMap.stacked[size]} object-contain drop-shadow-xl`}
          loading="eager"
        />
        {subtext && (
          <span className="text-[11px] font-mono tracking-wider text-slate-400 mt-2">
            {subtext}
          </span>
        )}
      </div>
    );
  }

  // If user requested badge format (shield emblem + custom title/subtitle flex container)
  if (variant === 'badge') {
    const textColorClass = theme === 'light' ? 'text-[#17202A]' : theme === 'dark' ? 'text-white' : 'text-[#17202A] dark:text-white';
    const subtextColorClass = theme === 'light' ? 'text-[#64748B]' : theme === 'dark' ? 'text-slate-400' : 'text-[#64748B] dark:text-slate-400';

    return (
      <div 
        onClick={onClick}
        className={`inline-flex items-center gap-2.5 sm:gap-3 select-none text-left ${onClick ? 'cursor-pointer group' : ''} ${className}`}
        role="img"
        aria-label="ResQZone - Intelligent Hazard Red Zone & Relocation System"
      >
        <div className="relative shrink-0 flex items-center justify-center">
          <img
            src={symbolAsset}
            alt="ResQZone Shield"
            className={`${sizeMap.symbol[size]} object-contain drop-shadow-md transition-transform duration-200 group-hover:scale-105`}
            loading="eager"
          />
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-mono font-black tracking-wider text-base sm:text-lg uppercase ${textColorClass}`}>
              RES<span className="text-[#DC2626]">Q</span><span className="text-[#DC2626]">Z</span>ONE
            </span>
          </div>
          <span className={`text-[10px] sm:text-[11px] font-medium tracking-tight truncate mt-0.5 ${subtextColorClass}`}>
            {subtext || 'Intelligent Hazard Red Zone & Relocation System'}
          </span>
        </div>
      </div>
    );
  }

  // Default: Horizontal layout (perfect for navbars, footers, headers)
  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center select-none ${onClick ? 'cursor-pointer group' : ''} ${className}`}
      role="img"
      aria-label="ResQZone - Safer People. Safer Communities."
    >
      {/* Dark theme image */}
      <img
        src={logoHorizontalDark}
        alt="ResQZone Logo"
        className={`${sizeMap.horizontal[size]} object-contain hidden dark:block drop-shadow-sm transition-transform duration-200 group-hover:scale-[1.02]`}
        loading="eager"
      />
      {/* Light theme image */}
      <img
        src={logoHorizontalLight}
        alt="ResQZone Logo"
        className={`${sizeMap.horizontal[size]} object-contain block dark:hidden drop-shadow-xs transition-transform duration-200 group-hover:scale-[1.02]`}
        loading="eager"
      />
    </div>
  );
};
