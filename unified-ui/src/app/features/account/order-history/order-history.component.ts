import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../../core/services/notification.service';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: { productName: string; quantity: number; unitPrice: number }[];
}

@Component({
  selector: 'app-order-history',
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.scss'],
})
export class OrderHistoryComponent implements OnInit {
  orders: Order[] = [];
  isLoading = true;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.http.get<Order[]>('/api/orders').subscribe({
      next: (orders) => {
        this.orders = orders;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.show('Failed to load orders.', 'error');
      },
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'DELIVERED':
      case 'COMPLETED':
        return 'badge-success';
      case 'PENDING':
      case 'PROCESSING':
        return 'badge-warning';
      case 'CANCELLED':
      case 'FAILED':
        return 'badge-error';
      default:
        return 'badge-default';
    }
  }
}
