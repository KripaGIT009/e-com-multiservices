import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusBadgeComponent, StatusVariant } from '../../components/status-badge/status-badge.component';

export interface ClosedOrder {
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
  imports: [CommonModule, StatusBadgeComponent],
  templateUrl: './closed-orders.component.html',
  styleUrls: ['./closed-orders.component.scss'],
})
export class ClosedOrdersComponent implements OnInit {
  // Mock data
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

  ngOnInit(): void {
    this.loadMockData();
    this.splitOrders();
    this.updateDeliveredPagination();
    this.updateCancelledPagination();
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

  private loadMockData(): void {
    this.allOrders = [
      {
        orderId: 'ORD-1001',
        productName: 'Basmati Rice 5kg',
        productImage: 'assets/images/placeholder-product.png',
        productSku: 'SKU-BR-001',
        quantity: 2,
        customerName: 'Rahul Sharma',
        customerPhone: '+91 98765 43210',
        amount: 1250,
        paymentMethod: 'UPI',
        orderDate: '2024-01-15',
        status: 'delivered',
        deliveryDate: '2024-01-18',
      },
      {
        orderId: 'ORD-1002',
        productName: 'Masala Chai Pack',
        productImage: 'assets/images/placeholder-product.png',
        productSku: 'SKU-MC-002',
        quantity: 3,
        customerName: 'Priya Patel',
        customerPhone: '+91 87654 32109',
        amount: 450,
        paymentMethod: 'Card',
        orderDate: '2024-01-14',
        status: 'delivered',
        deliveryDate: '2024-01-17',
      },
      {
        orderId: 'ORD-1003',
        productName: 'Organic Turmeric Powder',
        productImage: 'assets/images/placeholder-product.png',
        productSku: 'SKU-OT-003',
        quantity: 1,
        customerName: 'Amit Kumar',
        customerPhone: '+91 76543 21098',
        amount: 320,
        paymentMethod: 'COD',
        orderDate: '2024-01-13',
        status: 'cancelled',
        cancelReason: 'Customer requested cancellation',
      },
      {
        orderId: 'ORD-1004',
        productName: 'Ghee Premium 1L',
        productImage: 'assets/images/placeholder-product.png',
        productSku: 'SKU-GP-004',
        quantity: 1,
        customerName: 'Sneha Reddy',
        customerPhone: '+91 65432 10987',
        amount: 890,
        paymentMethod: 'UPI',
        orderDate: '2024-01-12',
        status: 'delivered',
        deliveryDate: '2024-01-15',
      },
      {
        orderId: 'ORD-1005',
        productName: 'Dry Fruits Mix 500g',
        productImage: 'assets/images/placeholder-product.png',
        productSku: 'SKU-DF-005',
        quantity: 2,
        customerName: 'Vikram Singh',
        customerPhone: '+91 54321 09876',
        amount: 1680,
        paymentMethod: 'Card',
        orderDate: '2024-01-11',
        status: 'delivered',
        deliveryDate: '2024-01-14',
      },
      {
        orderId: 'ORD-1006',
        productName: 'Saffron 1g Pack',
        productImage: 'assets/images/placeholder-product.png',
        productSku: 'SKU-SF-006',
        quantity: 1,
        customerName: 'Neha Gupta',
        customerPhone: '+91 43210 98765',
        amount: 550,
        paymentMethod: 'UPI',
        orderDate: '2024-01-10',
        status: 'cancelled',
        cancelReason: 'Item out of stock',
      },
      {
        orderId: 'ORD-1007',
        productName: 'Pickle Variety Pack',
        productImage: 'assets/images/placeholder-product.png',
        productSku: 'SKU-PV-007',
        quantity: 1,
        customerName: 'Arjun Nair',
        customerPhone: '+91 32109 87654',
        amount: 420,
        paymentMethod: 'COD',
        orderDate: '2024-01-09',
        status: 'delivered',
        deliveryDate: '2024-01-12',
      },
      {
        orderId: 'ORD-1008',
        productName: 'Rose Water 200ml',
        productImage: 'assets/images/placeholder-product.png',
        productSku: 'SKU-RW-008',
        quantity: 4,
        customerName: 'Kavitha Menon',
        customerPhone: '+91 21098 76543',
        amount: 360,
        paymentMethod: 'Card',
        orderDate: '2024-01-08',
        status: 'cancelled',
        cancelReason: 'Payment failed',
      },
      {
        orderId: 'ORD-1009',
        productName: 'Cardamom Pods 100g',
        productImage: 'assets/images/placeholder-product.png',
        productSku: 'SKU-CP-009',
        quantity: 2,
        customerName: 'Deepak Joshi',
        customerPhone: '+91 10987 65432',
        amount: 780,
        paymentMethod: 'UPI',
        orderDate: '2024-01-07',
        status: 'delivered',
        deliveryDate: '2024-01-10',
      },
      {
        orderId: 'ORD-1010',
        productName: 'Coconut Oil 500ml',
        productImage: 'assets/images/placeholder-product.png',
        productSku: 'SKU-CO-010',
        quantity: 1,
        customerName: 'Lakshmi Iyer',
        customerPhone: '+91 09876 54321',
        amount: 290,
        paymentMethod: 'COD',
        orderDate: '2024-01-06',
        status: 'delivered',
        deliveryDate: '2024-01-09',
      },
      {
        orderId: 'ORD-1011',
        productName: 'Jaggery Block 1kg',
        productImage: 'assets/images/placeholder-product.png',
        productSku: 'SKU-JB-011',
        quantity: 3,
        customerName: 'Suresh Rao',
        customerPhone: '+91 98712 34567',
        amount: 510,
        paymentMethod: 'UPI',
        orderDate: '2024-01-05',
        status: 'delivered',
        deliveryDate: '2024-01-08',
      },
      {
        orderId: 'ORD-1012',
        productName: 'Herbal Tea Set',
        productImage: 'assets/images/placeholder-product.png',
        productSku: 'SKU-HT-012',
        quantity: 1,
        customerName: 'Meera Das',
        customerPhone: '+91 87612 34567',
        amount: 640,
        paymentMethod: 'Card',
        orderDate: '2024-01-04',
        status: 'cancelled',
        cancelReason: 'Wrong address provided',
      },
    ];
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
