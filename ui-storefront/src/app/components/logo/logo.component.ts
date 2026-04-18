import { Component } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <div class="logo-container">
      <!-- Lotus + Om inspired icon -->
      <div class="logo-icon">
        <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="saffron" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#FF9933"/>
              <stop offset="100%" style="stop-color:#FF6B00"/>
            </linearGradient>
          </defs>
          <!-- Lotus petals -->
          <ellipse cx="24" cy="28" rx="5" ry="10" fill="url(#saffron)" transform="rotate(-30 24 28)"/>
          <ellipse cx="24" cy="28" rx="5" ry="10" fill="url(#saffron)" transform="rotate(0 24 28)"/>
          <ellipse cx="24" cy="28" rx="5" ry="10" fill="url(#saffron)" transform="rotate(30 24 28)"/>
          <ellipse cx="24" cy="28" rx="5" ry="10" fill="#FF9933" opacity="0.6" transform="rotate(-60 24 28)"/>
          <ellipse cx="24" cy="28" rx="5" ry="10" fill="#FF9933" opacity="0.6" transform="rotate(60 24 28)"/>
          <!-- Center circle (Ashoka Chakra inspired) -->
          <circle cx="24" cy="28" r="6" fill="#fff"/>
          <circle cx="24" cy="28" r="4" fill="none" stroke="#000080" stroke-width="1.5"/>
          <!-- Cart bag -->
          <path d="M18 14 h12 l2 8 H16 Z" fill="#138808"/>
          <path d="M21 14 Q21 10 24 10 Q27 10 27 14" fill="none" stroke="#138808" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="logo-text-block">
        <span class="logo-main">मेरी दुकान</span>
        <span class="logo-sub">My Indian Store</span>
      </div>
    </div>
  `,
  styles: [`
    .logo-container {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      user-select: none;
    }
    .logo-icon {
      width: 44px;
      height: 44px;
      background: #fff;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    }
    .logo-icon svg { width: 38px; height: 38px; }
    .logo-text-block {
      display: flex;
      flex-direction: column;
      line-height: 1.1;
    }
    .logo-main {
      font-size: 17px;
      font-weight: 800;
      color: #FF9933;
      letter-spacing: 0.5px;
      font-family: 'Segoe UI', sans-serif;
    }
    .logo-sub {
      font-size: 10px;
      color: #ccc;
      letter-spacing: 0.3px;
      font-weight: 500;
    }
  `]
})
export class LogoComponent {}
