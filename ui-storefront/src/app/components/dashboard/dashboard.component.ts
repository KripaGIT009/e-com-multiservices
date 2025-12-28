import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ItemService } from '../../services/item.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  template: `
    <div class="dashboard">
      <h1>Welcome to Storefront</h1>
      <p>Explore our products and add items to your cart.</p>
      
      <div class="stats">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Featured Products</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Browse our latest and most popular items</p>
            <button mat-raised-button color="primary" routerLink="/products">
              View Products
            </button>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 2rem;
    }
    
    h1 {
      margin-bottom: 1rem;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }
    
    mat-card {
      padding: 1.5rem;
    }
  `]
})
export class DashboardComponent implements OnInit {
  items: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(private itemService: ItemService) { }

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.loading = true;
    this.error = null;
    this.itemService.getItems().subscribe({
      next: (data) => {
        this.items = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load items';
        this.loading = false;
      }
    });
  }
}
