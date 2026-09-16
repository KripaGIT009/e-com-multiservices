import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { StatusBadgeComponent, StatusVariant } from '../../components/status-badge/status-badge.component';

/**
 * Order status type for active orders.
 */
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'out-for-delivery';

/**
 * Represents an order item in the active orders table.
 */
export interface ActiveOrder {
  /** order-service id, used to link to the order detail page. */
  id: number | null;
  orderId: string;
  productName: string;
  productImage: string;
  productSku: string;
  quantity: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  amount: number;
  paymentMethod: string;
  orderDate: string;
  status: OrderStatus;
  deliveryAddress: string;
  expectedDelivery: string;
}

interface KpiCard {
  label: string;
  value: number;
  icon: string;
}

/**
 * ActiveOrdersComponent
 *
 * Displays in-progress orders with KPI cards, search/filter controls,
 * a data table, and expandable details panel for each order.
 * Supports order status updates via backend API.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 12.4
 */
@Component({
  selector: 'app-active-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StatusBadgeComponent],
  templateUrl: './active-orders.component.html',
  styleUrls: ['./active-orders.component.scss'],
})
export class ActiveOrdersComponent implements OnInit {
  orders: ActiveOrder[] = [];
  filteredOrders: ActiveOrder[] = [];
  paginatedOrders: ActiveOrder[] = [];

  isLoading = true;
  hasError = false;
  errorMessage = '';

  // Search & Filters
  searchTerm = '';
  filterStatus = '';
  filterPaymentMethod = '';
  filterDateFrom = '';
  filterDateTo = '';

  // Expandable details
  expandedOrderId: string | null = null;

  // Status update
  statusUpdateLoading: string | null = null;
  statusUpdateError = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalOrders = 0;
  totalPages = 0;

  // Available statuses for dropdown
  readonly orderStatuses: { value: OrderStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'out-for-delivery', label: 'Out for Delivery' },
  ];

  // Payment methods for filter
  readonly paymentMethods = ['UPI', 'Credit Card', 'Debit Card', 'COD', 'Net Banking'];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  // ─── KPI Cards ───────────────────────────────────────────────────────────────

  get kpiCards(): KpiCard[] {
    return [
      { label: 'Total Active', value: this.orders.length, icon: '📋' },
      { label: 'Pending', value: this.orders.filter(o => o.status === 'pending').length, icon: '⏳' },
      { label: 'Confirmed', value: this.orders.filter(o => o.status === 'confirmed').length, icon: '✅' },
      { label: 'Shipped', value: this.orders.filter(o => o.status === 'shipped').length, icon: '🚚' },
    ];
  }

  // ─── Data Loading ────────────────────────────────────────────────────────────

  loadOrders(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    // Fetch real orders from the order-service via BFF
    this.http.get<any[]>('/api/orders').subscribe({
      next: (backendOrders) => {
        // Map backend orders to ActiveOrder interface and filter active ones
        this.orders = (backendOrders || [])
          .filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
          .map(o => this.mapBackendOrder(o))
          .sort((a, b) => (b.orderDate || '').localeCompare(a.orderDate || '')
                       || (b.orderId || '').localeCompare(a.orderId || ''));
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        // No fallback data: fabricated orders read as real ones (CODE_REVIEW.md §3.1).
        this.orders = [];
        this.applyFilters();
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = err?.error?.error || 'Could not load orders. Try again.';
      },
    });
  }

  private mapBackendOrder(o: any): ActiveOrder {
    const firstItem = o.items?.[0];
    return {
      id: o.id ?? null,
      orderId: o.orderNumber || `ORD-${o.id}`,
      productName: firstItem?.productName || 'Unknown Product',
      productImage: 'assets/images/placeholder-product.png',
      productSku: firstItem?.description || `SKU-${firstItem?.productId || '?'}`,
      quantity: firstItem?.quantity || 1,
      // Snapshots taken when the order was placed. Orders created before the order
      // model carried them fall back to the id, which is all that was ever recorded.
      customerName: o.customerName || `Customer #${o.customerId}`,
      customerPhone: o.customerPhone || '',
      customerEmail: o.customerEmail || '',
      amount: o.totalAmount || 0,
      paymentMethod: 'Online',
      orderDate: o.createdAt ? o.createdAt.split('T')[0] : '',
      status: this.mapStatus(o.status),
      deliveryAddress: o.shippingAddressLine || '',
      expectedDelivery: this.estimateDelivery(o.createdAt),
    };
  }

  /**
   * Standard delivery window until logistics-service can supply a real promise date.
   * Derived from the order date rather than invented, and clearly a window.
   */
  private estimateDelivery(createdAt?: string): string {
    if (!createdAt) return '';
    const placed = new Date(createdAt);
    if (isNaN(placed.getTime())) return '';
    placed.setDate(placed.getDate() + 5);
    return placed.toISOString().split('T')[0];
  }

  private mapStatus(backendStatus: string): OrderStatus {
    switch (backendStatus?.toUpperCase()) {
      case 'PENDING': return 'pending';
      case 'CONFIRMED': return 'confirmed';
      case 'SHIPPED': return 'shipped';
      case 'OUT_FOR_DELIVERY': return 'out-for-delivery';
      default: return 'pending';
    }
  }

  // ─── Search & Filtering ──────────────────────────────────────────────────────

  applyFilters(): void {
    let filtered = [...this.orders];

    // Search by order ID or customer name
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        o => o.orderId.toLowerCase().includes(term) || o.customerName.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (this.filterStatus) {
      filtered = filtered.filter(o => o.status === this.filterStatus);
    }

    // Filter by payment method
    if (this.filterPaymentMethod) {
      filtered = filtered.filter(o => o.paymentMethod === this.filterPaymentMethod);
    }

    // Filter by date range
    if (this.filterDateFrom) {
      const fromDate = new Date(this.filterDateFrom);
      filtered = filtered.filter(o => new Date(o.orderDate) >= fromDate);
    }
    if (this.filterDateTo) {
      const toDate = new Date(this.filterDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(o => new Date(o.orderDate) <= toDate);
    }

    this.filteredOrders = filtered;
    this.totalOrders = filtered.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalOrders / this.pageSize));
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    this.updatePagination();
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  // ─── Status Badge Helpers ────────────────────────────────────────────────────

  getStatusVariant(status: string): StatusVariant {
    switch (status) {
      case 'pending': return 'pending';
      case 'confirmed': return 'confirmed';
      case 'shipped': return 'shipped';
      case 'out-for-delivery': return 'shipped';
      default: return 'default';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'shipped': return 'Shipped';
      case 'out-for-delivery': return 'Out for Delivery';
      default: return status;
    }
  }

  // ─── Expandable Details ──────────────────────────────────────────────────────

  toggleDetails(orderId: string): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
    this.statusUpdateError = '';
  }

  isExpanded(orderId: string): boolean {
    return this.expandedOrderId === orderId;
  }

  getExpandedOrder(): ActiveOrder | undefined {
    return this.paginatedOrders.find(o => o.orderId === this.expandedOrderId);
  }

  // ─── Status Update ───────────────────────────────────────────────────────────

  updateOrderStatus(order: ActiveOrder, newStatus: OrderStatus): void {
    if (order.status === newStatus) return;

    this.statusUpdateLoading = order.orderId;
    this.statusUpdateError = '';

    // Update locally (backend integration will be added when endpoint exists)
    order.status = newStatus;
    this.statusUpdateLoading = null;
  }

  // ─── Pagination ──────────────────────────────────────────────────────────────

  updatePagination(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedOrders = this.filteredOrders.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(this.totalPages, start + maxVisible - 1);
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

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  retry(): void {
    this.loadOrders();
  }

}
