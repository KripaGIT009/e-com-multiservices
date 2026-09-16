import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { StatusBadgeComponent, StatusVariant } from '../../components/status-badge/status-badge.component';

export interface ClosedOrder {
  /** order-service id, used to link to the order detail page. */
  id: number | null;
  orderId: string;
  productName: string;
  productImage: string;
  productSku: string;
  quantity: number;
  customerName: string;
  customerPhone: string;
  amount: number;
  paymentMethod: string;
  orderDate: string;
  status: 'delivered' | 'cancelled';
  deliveryDate?: string;
  cancelReason?: string;
}

interface KpiCard {
  label: string;
  value: string;
  icon: string;
}

/**
 * ClosedOrdersComponent
 *
 * Displays delivered and cancelled orders in two separate tables
 * with independent pagination, KPI cards, and expandable details.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
@Component({
  selector: 'app-closed-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  templateUrl: './closed-orders.component.html',
  styleUrls: ['./closed-orders.component.scss'],
})
export class ClosedOrdersComponent implements OnInit {
  allOrders: ClosedOrder[] = [];
  deliveredOrders: ClosedOrder[] = [];
  cancelledOrders: ClosedOrder[] = [];

  // Pagination — Delivered
  deliveredPage = 1;
  deliveredPageSize = 5;
  deliveredTotalPages = 1;
  deliveredPaginated: ClosedOrder[] = [];

  // Pagination — Cancelled
  cancelledPage = 1;
  cancelledPageSize = 5;
  cancelledTotalPages = 1;
  cancelledPaginated: ClosedOrder[] = [];

  // Expandable details
  expandedOrderId: string | null = null;

  isLoading = true;
  hasError = false;
  errorMessage = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  // ─── KPI Cards ───────────────────────────────────────────────────────────────

  get kpiCards(): KpiCard[] {
    const totalRevenue = this.deliveredOrders.reduce((sum, o) => sum + o.amount, 0);
    return [
      { label: 'Total Closed', value: String(this.allOrders.length), icon: '📋' },
      { label: 'Total Revenue', value: '₹' + totalRevenue.toLocaleString('en-IN'), icon: '💰' },
      { label: 'Delivered', value: String(this.deliveredOrders.length), icon: '✅' },
      { label: 'Cancelled', value: String(this.cancelledOrders.length), icon: '❌' },
    ];
  }

  // ─── Data Loading ────────────────────────────────────────────────────────────

  loadOrders(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    this.http.get<any[]>('/api/orders').subscribe({
      next: (backendOrders) => {
        this.allOrders = (backendOrders || [])
          .filter((o) => o.status === 'DELIVERED' || o.status === 'CANCELLED')
          .map((o) => this.mapBackendOrder(o))
          .sort((a, b) => (b.orderDate || '').localeCompare(a.orderDate || ''));
        this.afterLoad();
        this.isLoading = false;
      },
      error: (err) => {
        // No sample rows on failure: invented orders read as real ones.
        this.allOrders = [];
        this.afterLoad();
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = err?.error?.error || 'Could not load closed orders. Try again.';
      },
    });
  }

  retry(): void {
    this.loadOrders();
  }

  private afterLoad(): void {
    this.splitOrders();
    this.updateDeliveredPagination();
    this.updateCancelledPagination();
  }

  private mapBackendOrder(o: any): ClosedOrder {
    const firstItem = o.items?.[0];
    return {
      id: o.id ?? null,
      orderId: o.orderNumber || ('ORD-' + o.id),
      productName: firstItem?.productName || 'Unknown product',
      productImage: 'assets/images/placeholder-product.png',
      productSku: firstItem?.description || ('SKU-' + (firstItem?.productId || '?')),
      quantity: firstItem?.quantity || 1,
      customerName: o.customerName || ('Customer #' + o.customerId),
      customerPhone: o.customerPhone || '',
      amount: o.totalAmount || 0,
      // The order model does not record how the customer paid yet.
      paymentMethod: 'Online',
      orderDate: o.createdAt ? o.createdAt.split('T')[0] : '',
      status: o.status === 'CANCELLED' ? 'cancelled' : 'delivered',
      deliveryDate: o.status === 'DELIVERED' && o.updatedAt ? o.updatedAt.split('T')[0] : undefined,
      cancelReason: o.notes || undefined,
    };
  }

  private splitOrders(): void {
    this.deliveredOrders = this.allOrders.filter(o => o.status === 'delivered');
    this.cancelledOrders = this.allOrders.filter(o => o.status === 'cancelled');
  }

  // ─── Status Badge Helpers ────────────────────────────────────────────────────

  getStatusVariant(status: string): StatusVariant {
    return status === 'delivered' ? 'delivered' : 'cancelled';
  }

  getStatusText(status: string): string {
    return status === 'delivered' ? 'Delivered' : 'Cancelled';
  }

  // ─── Expandable Details ──────────────────────────────────────────────────────

  toggleDetails(orderId: string): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  isExpanded(orderId: string): boolean {
    return this.expandedOrderId === orderId;
  }

  // ─── Pagination — Delivered ──────────────────────────────────────────────────

  updateDeliveredPagination(): void {
    this.deliveredTotalPages = Math.max(1, Math.ceil(this.deliveredOrders.length / this.deliveredPageSize));
    if (this.deliveredPage > this.deliveredTotalPages) {
      this.deliveredPage = 1;
    }
    const start = (this.deliveredPage - 1) * this.deliveredPageSize;
    this.deliveredPaginated = this.deliveredOrders.slice(start, start + this.deliveredPageSize);
  }

  goToDeliveredPage(page: number): void {
    if (page < 1 || page > this.deliveredTotalPages) return;
    this.deliveredPage = page;
    this.updateDeliveredPagination();
  }

  nextDeliveredPage(): void {
    this.goToDeliveredPage(this.deliveredPage + 1);
  }

  prevDeliveredPage(): void {
    this.goToDeliveredPage(this.deliveredPage - 1);
  }

  get deliveredPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.deliveredPage - Math.floor(maxVisible / 2));
    const end = Math.min(this.deliveredTotalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // ─── Pagination — Cancelled ──────────────────────────────────────────────────

  updateCancelledPagination(): void {
    this.cancelledTotalPages = Math.max(1, Math.ceil(this.cancelledOrders.length / this.cancelledPageSize));
    if (this.cancelledPage > this.cancelledTotalPages) {
      this.cancelledPage = 1;
    }
    const start = (this.cancelledPage - 1) * this.cancelledPageSize;
    this.cancelledPaginated = this.cancelledOrders.slice(start, start + this.cancelledPageSize);
  }

  goToCancelledPage(page: number): void {
    if (page < 1 || page > this.cancelledTotalPages) return;
    this.cancelledPage = page;
    this.updateCancelledPagination();
  }

  nextCancelledPage(): void {
    this.goToCancelledPage(this.cancelledPage + 1);
  }

  prevCancelledPage(): void {
    this.goToCancelledPage(this.cancelledPage - 1);
  }

  get cancelledPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.cancelledPage - Math.floor(maxVisible / 2));
    const end = Math.min(this.cancelledTotalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // ─── Formatting ──────────────────────────────────────────────────────────────

  formatCurrency(amount: number): string {
    if (amount == null) return '₹0.00';
    return '₹' + amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
