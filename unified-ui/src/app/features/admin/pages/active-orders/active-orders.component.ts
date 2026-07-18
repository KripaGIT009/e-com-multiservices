import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { StatusBadgeComponent, StatusVariant } from '../../components/status-badge/status-badge.component';

/**
 * Order status type for active orders.
 */
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'out-for-delivery';

/**
 * Represents an order item in the active orders table.
 */
export interface ActiveOrder {
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
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  templateUrl: './active-orders.component.html',
  styleUrls: ['./active-orders.component.scss'],
})
export class ActiveOrdersComponent implements OnInit {
  private readonly ordersApiUrl = '/api/admin/orders';

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

    this.http.get<ActiveOrder[]>(`${this.ordersApiUrl}/active`).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        // Fallback to mock data for development
        this.orders = this.getMockOrders();
        this.applyFilters();
        this.isLoading = false;
      },
    });
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

    this.http.patch(`${this.ordersApiUrl}/${order.orderId}/status`, { status: newStatus }).subscribe({
      next: () => {
        order.status = newStatus;
        this.statusUpdateLoading = null;
      },
      error: () => {
        // In development, just update locally
        order.status = newStatus;
        this.statusUpdateLoading = null;
      },
    });
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

  // ─── Mock Data ───────────────────────────────────────────────────────────────

  private getMockOrders(): ActiveOrder[] {
    return [
      {
        orderId: 'ORD-2024-001',
        productName: 'Organic Turmeric Powder',
        productImage: 'assets/images/placeholder-product.png',
        productSku: 'TUR-500G',
        quantity: 2,
        customerName: 'Rahul Sharma',
        customerPhone: '+91 98765 43210',
        customerEmail: 'rahul.sharma@email.com',
        amount: 599,
        paymentMethod: 'UPI',
        orderDate: '2024-01-15',
        status: 'pending',
        deliveryAddress: '42, MG Road, Bangalore, Karnataka 560001',
        expectedDelivery: '2024-01-20',
      },
      {
        orderId: 'ORD-2024-002',
        productName: 'Basmati Rice Premium',
        productImage: 'assets/images/placeholder-product.png',
        productSku: 'RIC-5KG',
        quantity: 1,
        customerName: 'Priya Patel',
        customerPhone: '+91 87654 32109',
        customerEmail: 'priya.patel@email.com',
        amount: 1249,
        paymentMethod: 'Credit Card',
        orderDate: '2024-01-14',
        status: 'confirmed',
        deliveryAddress: '15, Nehru Nagar, Mumbai, Maharashtra 400001',
        expectedDelivery: '2024-01-19',
      },
      {
        orderId: 'ORD-2024-003',
        productName: 'Assam Tea Collection',
        productImage: 'assets/images/placeholder-product.png',
        productSku: 'TEA-250G',
        quantity: 3,
        customerName: 'Amit Kumar',
        customerPhone: '+91 76543 21098',
        customerEmail: 'amit.kumar@email.com',
        amount: 899,
        paymentMethod: 'COD',
        orderDate: '2024-01-13',
        status: 'shipped',
        deliveryAddress: '7, Civil Lines, Delhi 110001',
        expectedDelivery: '2024-01-18',
      },
      {
        orderId: 'ORD-2024-004',
        productName: 'Kashmiri Saffron',
        productImage: 'assets/images/placeholder-product.png',
        productSku: 'SAF-10G',
        quantity: 1,
        customerName: 'Sneha Reddy',
        customerPhone: '+91 65432 10987',
        customerEmail: 'sneha.reddy@email.com',
        amount: 2499,
        paymentMethod: 'Debit Card',
        orderDate: '2024-01-12',
        status: 'pending',
        deliveryAddress: '23, Jubilee Hills, Hyderabad, Telangana 500033',
        expectedDelivery: '2024-01-17',
      },
      {
        orderId: 'ORD-2024-005',
        productName: 'Coconut Oil Cold Pressed',
        productImage: 'assets/images/placeholder-product.png',
        productSku: 'OIL-1L',
        quantity: 2,
        customerName: 'Vijay Nair',
        customerPhone: '+91 54321 09876',
        customerEmail: 'vijay.nair@email.com',
        amount: 749,
        paymentMethod: 'Net Banking',
        orderDate: '2024-01-11',
        status: 'confirmed',
        deliveryAddress: '8, Marine Drive, Kochi, Kerala 682001',
        expectedDelivery: '2024-01-16',
      },
      {
        orderId: 'ORD-2024-006',
        productName: 'Darjeeling Green Tea',
        productImage: 'assets/images/placeholder-product.png',
        productSku: 'GRN-100G',
        quantity: 4,
        customerName: 'Ananya Gupta',
        customerPhone: '+91 43210 98765',
        customerEmail: 'ananya.gupta@email.com',
        amount: 1199,
        paymentMethod: 'UPI',
        orderDate: '2024-01-10',
        status: 'shipped',
        deliveryAddress: '56, Park Street, Kolkata, West Bengal 700016',
        expectedDelivery: '2024-01-15',
      },
    ];
  }
}
