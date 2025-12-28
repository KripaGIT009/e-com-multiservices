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
    <div class="container">
      <h1>Admin Dashboard</h1>
      
      <div class="row">
        <div class="col-md-3 mb-3" *ngFor="let card of dashboardCards">
          <mat-card class="dashboard-card" (click)="navigate(card.route)">
            <mat-card-content>
              <mat-icon class="dashboard-icon">{{card.icon}}</mat-icon>
              <h2>{{card.title}}</h2>
              <p>{{card.description}}</p>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-card {
      cursor: pointer;
      text-align: center;
      transition: transform 0.2s;
    }
    
    .dashboard-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }
    
    .dashboard-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      color: #3f51b5;
    }
  `]
})
export class DashboardComponent {
  dashboardCards = [
    { title: 'Users', description: 'Manage users', icon: 'people', route: '/users' },
    { title: 'Items', description: 'Manage items', icon: 'inventory', route: '/items' },
    { title: 'Inventory', description: 'Manage inventory', icon: 'warehouse', route: '/inventory' },
    { title: 'Orders', description: 'Manage orders', icon: 'shopping_cart', route: '/orders' },
    { title: 'Payments', description: 'View payments', icon: 'payment', route: '/payments' },
    { title: 'Shipments', description: 'Track shipments', icon: 'local_shipping', route: '/shipments' },
    { title: 'Returns', description: 'Manage returns', icon: 'keyboard_return', route: '/returns' },
    { title: 'Audit Logs', description: 'View audit logs', icon: 'history', route: '/audit' }
  ];

  constructor(private router: Router) {}

  navigate(route: string): void {
    this.router.navigate([route]);
  }
}
