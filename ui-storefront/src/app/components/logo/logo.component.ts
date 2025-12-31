import { Component } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <div class="logo-container">
      <svg 
        viewBox="0 0 120 120" 
        class="logo-svg"
        xmlns="http://www.w3.org/2000/svg">
        <!-- Background Circle -->
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#ff9900;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#ff7700;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#138808;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0d5c0d;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Outer Circle Background -->
        <circle cx="60" cy="60" r="58" fill="url(#bgGradient)" stroke="#131921" stroke-width="2"/>
        
        <!-- Decorative Lotus Pattern (Top) -->
        <g opacity="0.3">
          <path d="M60 15 L65 25 L75 28 L65 32 L68 42 L60 38 L52 42 L55 32 L45 28 L55 25 Z" 
                fill="#fff" stroke="none"/>
        </g>
        
        <!-- Shopping Bag Shape -->
        <g transform="translate(60, 60)">
          <!-- Bag Body -->
          <path d="M -20 -8 L -22 8 Q -22 14 -16 14 L 16 14 Q 22 14 22 8 L 20 -8 Z" 
                fill="#fff" stroke="none"/>
          
          <!-- Bag Handle -->
          <path d="M -12 -8 Q -12 -20 0 -20 Q 12 -20 12 -8" 
                fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
          
          <!-- Accent Stripe (Green) -->
          <rect x="-22" y="5" width="44" height="3" fill="url(#accentGradient)" rx="1"/>
          
          <!-- Shine Effect -->
          <ellipse cx="-8" cy="-2" rx="4" ry="6" fill="#fff" opacity="0.4"/>
        </g>
        
        <!-- Decorative Elements (Bottom) -->
        <circle cx="30" cy="100" r="3" fill="#fff" opacity="0.5"/>
        <circle cx="90" cy="100" r="3" fill="#fff" opacity="0.5"/>
        <circle cx="60" cy="105" r="2" fill="#fff" opacity="0.5"/>
      </svg>
      <span class="logo-text">My Indian Store</span>
    </div>
  `,
  styles: [`
    .logo-container {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      user-select: none;
    }

    .logo-svg {
      height: 50px;
      width: 50px;
      min-width: 50px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }

    .logo-text {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.5px;
      white-space: nowrap;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    @media (max-width: 768px) {
      .logo-container {
        gap: 6px;
      }

      .logo-svg {
        height: 40px;
        width: 40px;
      }

      .logo-text {
        font-size: 14px;
      }
    }
  `]
})
export class LogoComponent {}
