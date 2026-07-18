import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface OrderLineItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Order {
  id: number;
  customerName: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  items: OrderLineItem[];
  shippingAddress: ShippingAddress;
}

/**
 * Admin Order Management sub-page.
 * Displays a paginated order table with detail view and status update actions.
 * Requirements: 11.1, 11.2, 11.3
 */
@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.scss'],
})
export class OrderManagementComponent implements OnInit {
  orders: Order[] = [];
  allOrders: Order[] = [];
  isLoading = true;
  errorMessage = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  // Detail view
  selectedOrder: Order | null = null;
  isDetailLoading = false;
  detailErrorMessage = '';

  // Status update
  newStatus = '';
  isUpdatingStatus = false;
  statusOptions = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<Order[]>('/api/orders').subscribe({
      next: (data) => {
        this.allOrders = data.map((order) => ({
          ...order,
          items: order.items || [],
          shippingAddress: order.shippingAddress || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: '',
          },
          paymentStatus: order.paymentStatus || 'Unknown',
        }));
        this.updatePagination();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load orders. Please try again.';
        this.isLoading = false;
      },
    });
  }

  updatePagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.allOrders.length / this.pageSize));
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    this.orders = this.allOrders.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  selectOrder(orderId: number): void {
    const order = this.allOrders.find((o) => o.id === orderId);
    if (order) {
      this.selectedOrder = order;
      this.newStatus = order.status;
      this.detailErrorMessage = '';
    }
  }

  closeDetail(): void {
    this.selectedOrder = null;
    this.detailErrorMessage = '';
  }

  updateOrderStatus(): void {
    if (!this.selectedOrder || this.newStatus === this.selectedOrder.status) return;

    this.isUpdatingStatus = true;
    this.detailErrorMessage = '';

    this.http
      .put(`/api/orders/${this.selectedOrder.id}/status`, { status: this.newStatus })
      .subscribe({
        next: () => {
          if (this.selectedOrder) {
            this.selectedOrder.status = this.newStatus;
            const idx = this.allOrders.findIndex((o) => o.id === this.selectedOrder!.id);
            if (idx !== -1) {
              this.allOrders[idx].status = this.newStatus;
            }
          }
          this.isUpdatingStatus = false;
          this.updatePagination();
        },
        error: (err) => {
          this.detailErrorMessage = 'Failed to update order status. Please try again.';
          this.isUpdatingStatus = false;
        },
      });
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'status-pending';
      case 'CONFIRMED':
        return 'status-confirmed';
      case 'SHIPPED':
        return 'status-shipped';
      case 'DELIVERED':
        return 'status-delivered';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatCurrency(amount: number): string {
    if (amount == null) return '₹0.00';
    return '₹' + amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
