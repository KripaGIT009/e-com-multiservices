import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p class="subtitle">Manage your e-commerce platform</p>
      </div>
      
      <div class="dashboard-grid">
        <mat-card class="dashboard-card" *ngFor="let card of dashboardCards" (click)="navigate(card.route)">
          <div class="card-header" [style.background]="card.color">
            <mat-icon class="dashboard-icon">{{card.icon}}</mat-icon>
          </div>
          <mat-card-content class="card-content">
            <h3>{{card.title}}</h3>
            <p>{{card.description}}</p>
            <button mat-raised-button color="primary" class="card-button">
              View Details
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: calc(100vh - 64px);
    }
    
    .dashboard-header {
      text-align: center;
      margin-bottom: 40px;
      animation: fadeIn 0.6s ease-in;
    }
    
    .dashboard-header h1 {
      font-size: 2.5rem;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 8px;
    }
    
    .subtitle {
      font-size: 1.1rem;
      color: #7f8c8d;
      margin: 0;
    }
    
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .dashboard-card {
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      border-radius: 12px !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
      animation: slideUp 0.5s ease-out backwards;
    }
    
    .dashboard-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 12px 24px rgba(0,0,0,0.15) !important;
    }
    
    .card-header {
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
      overflow: hidden;
    }
    
    .card-header::before {
      content: '';
      position: absolute;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: pulse 3s ease-in-out infinite;
    }
    
    .dashboard-icon {
      font-size: 64px !important;
      height: 64px !important;
      width: 64px !important;
      color: white;
      z-index: 1;
      position: relative;
    }
    
    .card-content {
      padding: 24px !important;
      text-align: center;
      background: white;
    }
    
    .card-content h3 {
      font-size: 1.4rem;
      font-weight: 600;
      color: #2c3e50;
      margin: 0 0 8px 0;
    }
    
    .card-content p {
      font-size: 0.95rem;
      color: #7f8c8d;
      margin: 0 0 20px 0;
      min-height: 40px;
    }
    
    .card-button {
      width: 100%;
      border-radius: 8px !important;
      font-weight: 500 !important;
    }
    
    .card-button mat-icon {
      margin-left: 8px;
      font-size: 18px;
      height: 18px;
      width: 18px;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes pulse {
      0%, 100% {
        transform: translate(-50%, -50%) scale(1);
      }
      50% {
        transform: translate(-50%, -50%) scale(1.1);
      }
    }
    
    @media (max-width: 768px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
      
      .dashboard-header h1 {
        font-size: 2rem;
      }
    }
  `]
})
export class DashboardComponent {
  dashboardCards = [
    { 
      title: 'Users', 
      description: 'Manage user accounts and permissions', 
      icon: 'people', 
      route: '/users',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    { 
      title: 'Items', 
      description: 'Manage product catalog and inventory', 
      icon: 'inventory', 
      route: '/items',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    { 
      title: 'Orders', 
      description: 'View and process customer orders', 
      icon: 'shopping_cart', 
      route: '/orders',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    { 
      title: 'Cart', 
      description: 'Monitor active shopping carts', 
      icon: 'add_shopping_cart', 
      route: '/cart',
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    { 
      title: 'Payments', 
      description: 'Track payment transactions', 
      icon: 'payment', 
      route: '/payments',
      color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    { 
      title: 'Inventory', 
      description: 'Monitor stock levels and alerts', 
      icon: 'warehouse', 
      route: '/inventory',
      color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
    },
    { 
      title: 'Returns', 
      description: 'Handle product returns and refunds', 
      icon: 'keyboard_return', 
      route: '/returns',
      color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    },
    { 
      title: 'Shipments', 
      description: 'Track delivery and logistics', 
      icon: 'local_shipping', 
      route: '/shipments',
      color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
    },
    { 
      title: 'Notifications', 
      description: 'System alerts and messages', 
      icon: 'notifications', 
      route: '/notifications',
      color: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    }
  ];

  constructor(private router: Router) {}

  navigate(route: string): void {
    this.router.navigate([route]);
  }
}
