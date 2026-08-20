/**
 * High-definition vector portrait for SP AI Teacher
 * Features stylish cyberpunk lighting, holographic headset, and layered facial features for lip-sync.
 */
export const AI_TEACHER_AVATAR_SVG = `
<svg viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
  <defs>
    <!-- Background Gradient -->
    <radialGradient id="bgGrad" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="60%" stop-color="#090514" />
      <stop offset="100%" stop-color="#020108" />
    </radialGradient>

    <!-- Hair Gradient -->
    <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ec4899" />
      <stop offset="50%" stop-color="#8b5cf6" />
      <stop offset="100%" stop-color="#3b82f6" />
    </linearGradient>

    <!-- Skin Gradient -->
    <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fed7aa" />
      <stop offset="65%" stop-color="#fdba74" />
      <stop offset="100%" stop-color="#f97316" />
    </linearGradient>

    <!-- Holographic Cyber Headset -->
    <linearGradient id="cyberGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06b6d4" />
      <stop offset="50%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#ec4899" />
    </linearGradient>

    <!-- Eye Iris -->
    <radialGradient id="irisGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="70%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#1e1b4b" />
    </radialGradient>

    <!-- Glow Filter -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Ambient Glow Backdrop -->
  <circle cx="300" cy="300" r="280" fill="url(#bgGrad)" />
  <circle cx="300" cy="300" r="250" stroke="url(#cyberGlow)" stroke-width="1.5" stroke-opacity="0.3" stroke-dasharray="8 6" />

  <!-- Shoulders & Outfit -->
  <path d="M150 560 C170 470 230 440 300 440 C370 440 430 470 450 560 Z" fill="#18181b" />
  <path d="M210 445 L300 490 L390 445 L360 560 L240 560 Z" fill="#27272a" />
  <path d="M260 470 L300 560 L340 470 Z" fill="url(#cyberGlow)" fill-opacity="0.2" />

  <!-- Neck -->
  <path d="M265 370 L335 370 L345 460 L255 460 Z" fill="url(#skinGrad)" />
  <path d="M265 420 Q300 445 335 420 Z" fill="#ea580c" fill-opacity="0.3" />

  <!-- Back Hair -->
  <path d="M170 240 C140 330 150 440 180 500 C200 440 210 380 215 320 Z" fill="url(#hairGrad)" />
  <path d="M430 240 C460 330 450 440 420 500 C400 440 390 380 385 320 Z" fill="url(#hairGrad)" />

  <!-- Face Base Structure -->
  <path d="M210 220 C205 310 240 400 300 405 C360 400 395 310 390 220 C385 140 215 140 210 220 Z" fill="url(#skinGrad)" />

  <!-- Soft Blush -->
  <ellipse cx="240" cy="305" rx="26" ry="14" fill="#f43f5e" fill-opacity="0.25" />
  <ellipse cx="360" cy="305" rx="26" ry="14" fill="#f43f5e" fill-opacity="0.25" />

  <!-- Eyebrows (Sassy, expressive arch) -->
  <path d="M230 235 Q260 222 280 232" stroke="#4c1d95" stroke-width="4" stroke-linecap="round" />
  <path d="M370 235 Q340 222 320 232" stroke="#4c1d95" stroke-width="4" stroke-linecap="round" />

  <!-- Left Eye -->
  <g transform="translate(0, 0)">
    <path d="M230 260 Q255 242 280 260 Q255 272 230 260 Z" fill="#ffffff" />
    <circle cx="256" cy="258" r="11" fill="url(#irisGrad)" />
    <circle cx="256" cy="258" r="5" fill="#09090b" />
    <circle cx="253" cy="254" r="3" fill="#ffffff" />
    <!-- Eyeliner & Lashes -->
    <path d="M225 260 Q255 240 285 258" stroke="#18181b" stroke-width="3.5" stroke-linecap="round" />
  </g>

  <!-- Right Eye -->
  <g transform="translate(0, 0)">
    <path d="M320 260 Q345 242 370 260 Q345 272 320 260 Z" fill="#ffffff" />
    <circle cx="344" cy="258" r="11" fill="url(#irisGrad)" />
    <circle cx="344" cy="258" r="5" fill="#09090b" />
    <circle cx="341" cy="254" r="3" fill="#ffffff" />
    <!-- Eyeliner & Lashes -->
    <path d="M315 258 Q345 240 375 260" stroke="#18181b" stroke-width="3.5" stroke-linecap="round" />
  </g>

  <!-- Cute Nose -->
  <path d="M296 280 L293 305 Q300 312 307 305" stroke="#ea580c" stroke-width="2.5" stroke-linecap="round" fill="none" />

  <!-- Front Styled Hair & Bangs -->
  <path d="M195 180 C230 110 370 110 405 180 C415 220 400 280 395 300 C380 220 370 180 340 180 C310 180 295 210 280 230 C270 200 250 170 220 180 C205 185 200 250 195 300 C190 280 180 220 195 180 Z" fill="url(#hairGrad)" />

  <!-- Holographic Cyber Headset & Earpiece -->
  <path d="M190 270 Q180 230 200 200" stroke="url(#cyberGlow)" stroke-width="4" stroke-linecap="round" filter="url(#glow)" />
  <circle cx="190" cy="270" r="10" fill="#06b6d4" filter="url(#glow)" />
  <circle cx="190" cy="270" r="4" fill="#ffffff" />
  
  <!-- Cyber Mic Boom Indicator -->
  <path d="M190 270 Q210 320 245 340" stroke="#06b6d4" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="4 2" />
  <circle cx="245" cy="340" r="4" fill="#ec4899" filter="url(#glow)" />
</svg>
`;
