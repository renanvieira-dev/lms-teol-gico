import React from 'react';

export function LogoIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradiente de Fundo do Squircle */}
        <linearGradient id="logoBgGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1C1814" />
          <stop offset="100%" stopColor="#0B0D13" />
        </linearGradient>

        {/* Gradiente Dourado Nobre para o Símbolo Tau-Códice */}
        <linearGradient id="goldFilament" x1="12" y1="10" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Brilho da borda sutil Apple-style */}
        <linearGradient id="borderShine" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(245, 158, 11, 0.4)" />
          <stop offset="50%" stopColor="rgba(255, 255, 255, 0.08)" />
          <stop offset="100%" stopColor="rgba(245, 158, 11, 0.15)" />
        </linearGradient>
      </defs>

      {/* 1. Base Squircle com Borda Iluminada */}
      <rect 
        x="1" 
        y="1" 
        width="46" 
        height="46" 
        rx="13" 
        fill="url(#logoBgGrad)" 
        stroke="url(#borderShine)" 
        strokeWidth="1.5" 
      />

      {/* 2. Símbolo Central: Códice / Tau Minimalista */}
      {/* Asa Esquerda do Livro / Abertura */}
      <path
        d="M13 18C13 15.7909 14.7909 14 17 14H22V32C19.5 32 16.5 32.8 13 34.5V18Z"
        fill="url(#goldFilament)"
        fillOpacity="0.85"
      />

      {/* Asa Direita do Livro */}
      <path
        d="M35 18C35 15.7909 33.2091 14 31 14H26V32C28.5 32 31.5 32.8 35 34.5V18Z"
        fill="url(#goldFilament)"
      />

      {/* Haste Central Iluminada (O Feixe de Luz / Viga do Tau) */}
      <rect 
        x="22.5" 
        y="11" 
        width="3" 
        height="23" 
        rx="1.5" 
        fill="#FFFBEB" 
      />

      {/* Playhead Discreto no Centro da Revelação */}
      <polygon 
        points="23.2,19.5 27,22 23.2,24.5" 
        fill="#0B0D13" 
      />
    </svg>
  );
}