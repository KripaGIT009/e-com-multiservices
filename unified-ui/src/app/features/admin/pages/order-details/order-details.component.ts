import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent, BreadcrumbSegment } from '../../components/breadcrumb/breadcrumb.component';
import { StatusBadgeComponent, StatusVariant } from '../../components/status-badge/status-badge.component';

/**
 * Order timeline stage definition.
 */
export interface OrderTimelineStep {
  stage: string;
  date?: string;
  completed: boolean;
  current: boolean;
}

/**
 * Order item in the order items table.
 */
export interface OrderItem {
  productName: string;
  productImage: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

/**
 * Full order details model.
 */
export interface OrderDetails {
  orderId: string;
  status: string;
  statusVariant: StatusVariant;
  productName: string;
  productImage: string;
  productSku: string;
  category: string;
  brand: string;
  unitPrice: number;
  quantity: number;
  productTotal: number;
  itemTotal: number;
  shipping: number;
  tax: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  orderDate: string;
  expectedDelivery: string;
  courierPartner: string;
  trackingId: string;
  timeline: OrderTimelineStep[];
  orderItems: OrderItem[];
}

/**
 * OrderDetailsComponent
 *
 * Full-page order view with:
 * - Breadcrumb navigation (Dashboard > Active Orders > Order #[ID])
 * - Order ID and Status badge in page header
 * - "Back to Active Orders" navigation link
 * - "Update Order Status" dropdown
 * - Product Details section
 * - Price Breakdown section
 * - Delivery and Customer Details section
 * - Order Timeline vertical stepper
 * - Order Items table with summary
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 12.5
 */
@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BreadcrumbComponent, StatusBadgeComponent],
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
})
export class OrderDetailsComponent implements OnInit {
  orderId = '';
  breadcrumbSegments: BreadcrumbSegment[] = [];
  order!: OrderDetails;
  selectedStatus = '';

  statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'out-for-delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') || 'ORD-001';
    this.breadcrumbSegments = [
      { label: 'Dashboard', routerLink: '/admin' },
      { label: 'Active Orders', routerLink: '/admin/orders/active' },
      { label: `Order #${this.orderId}` },
    ];
    this.loadMockOrder();
    this.selectedStatus = this.order.status;
  }

  navigateBack(): void {
    this.router.navigate(['/admin/orders/active']);
  }

  onStatusChange(newStatus: string): void {
    this.selectedStatus = newStatus;
    // In production, this would call a backend API to update order status
    this.order.status = newStatus;
    this.order.statusVariant = this.getStatusVariant(newStatus);
  }

  getStatusVariant(status: string): StatusVariant {
    const variantMap: Record<string, StatusVariant> = {
      'pending': 'pending',
      'confirmed': 'confirmed',
      'shipped': 'shipped',
      'out-for-delivery': 'shipped',
      'delivered': 'delivered',
      'cancelled': 'cancelled',
    };
    return variantMap[status] || 'default';
  }

  getStatusDisplayText(status: string): string {
    const textMap: Record<string, string> = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'shipped': 'Shipped',
      'out-for-delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
    };
    return textMap[status] || status;
  }

  get orderSubtotal(): number {
    return this.order.orderItems.reduce((sum, item) => sum + item.total, 0);
  }

  get orderTax(): number {
    return this.order.tax;
  }

  get orderShipping(): number {
    return this.order.shipping;
  }

  get orderGrandTotal(): number {
    return this.order.grandTotal;
  }

  private loadMockOrder(): void {
    this.order = {
      orderId: this.orderId,
      status: 'shipped',
      statusVariant: 'shipped',
      productName: 'Organic Turmeric Powder - Premium Quality',
      productImage: 'assets/images/products/turmeric.jpg',
      productSku: 'TUR-ORG-500',
      category: 'Food & Grocery',
      brand: 'Nature\'s Best',
      unitPrice: 349,
      quantity: 2,
      productTotal: 698,
      itemTotal: 698,
      shipping: 49,
      tax: 34.90,
      grandTotal: 781.90,
      paymentMethod: 'UPI',
      paymentStatus: 'Paid',
      customerName: 'Rajesh Kumar',
      customerPhone: '+91 98765 43210',
      customerEmail: 'rajesh.kumar@email.com',
      deliveryAddress: '42, Nehru Street, Koramangala, Bangalore, Karnataka - 560034',
      orderDate: '2024-01-15',
      expectedDelivery: '2024-01-20',
      courierPartner: 'Delhivery',
      trackingId: 'DLV2024011598765',
      timeline: [
        { stage: 'Order Placed', date: '2024-01-15 10:30 AM', completed: true, current: false },
        { stage: 'Payment Confirmed', date: '2024-01-15 10:32 AM', completed: true, current: false },
        { stage: 'Processing', date: '2024-01-15 02:00 PM', completed: true, current: false },
        { stage: 'Shipped', date: '2024-01-16 09:15 AM', completed: true, current: true },
        { stage: 'Out for Delivery', date: undefined, completed: false, current: false },
        { stage: 'Delivered', date: undefined, completed: false, current: false },
      ],
      orderItems: [
        {
          productName: 'Organic Turmeric Powder - Premium Quality',
          productImage: 'assets/images/products/turmeric.jpg',
          sku: 'TUR-ORG-500',
          unitPrice: 349,
          quantity: 2,
          total: 698,
        },
      ],
    };
  }
}
