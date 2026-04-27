import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface ShipmentEvent {
  id?: number;
  shipmentId: number;
  eventType: string;
  description: string;
  eventTime: string;
}

interface Shipment {
  id?: number;
  shipmentNumber: string;
  orderId: string;
  status: string;
  carrier?: string;
  trackingNumber?: string;
  carrierTrackingUrl?: string;
  deliveryAddress?: string;
  estimatedDelivery?: string;
  lastStatusNote?: string;
  createdAt?: string;
}

const TIMELINE_STEPS = [
  { status: 'ORDER_PLACED',       label: 'Order Placed',       icon: 'receipt' },
  { status: 'PROCESSING',         label: 'Processing',         icon: 'inventory_2' },
  { status: 'LABEL_GENERATED',    label: 'Label Generated',    icon: 'label' },
  { status: 'PICKED_UP',          label: 'Picked Up',          icon: 'store' },
  { status: 'IN_TRANSIT',         label: 'In Transit',         icon: 'local_shipping' },
  { status: 'OUT_FOR_DELIVERY',   label: 'Out for Delivery',   icon: 'delivery_dining' },
  { status: 'DELIVERED',          label: 'Delivered',          icon: 'check_circle' },
];

const EXCEPTION_STATUSES = ['ATTEMPTED_DELIVERY', 'EXCEPTION', 'RETURNED'];

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tracking-container">
      <button class="back-btn" (click)="goBack()">&#8592; Back to Orders</button>

      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading shipment info...</p>
      </div>

      <div *ngIf="error && !loading" class="error-state">
        <div class="error-icon">&#128230;</div>
        <h2>Tracking Unavailable</h2>
        <p>{{ error }}</p>
        <button class="primary-btn" (click)="goBack()">Back to Orders</button>
      </div>

      <div *ngIf="shipment && !loading" class="tracking-content">
        <div class="tracking-header">
          <div class="header-left">
            <div class="order-label">Order #{{ orderId }}</div>
            <div class="shipment-number">Shipment: {{ shipment.shipmentNumber }}</div>
          </div>
          <div class="status-badge" [ngClass]="'badge-' + statusClass(shipment.status)">
            {{ formatStatus(shipment.status) }}
          </div>
        </div>

        <div class="tracking-summary">
          <div class="summary-item" *ngIf="shipment.carrier">
            <span class="summary-label">Carrier</span>
            <span class="summary-value">{{ shipment.carrier }}</span>
          </div>
          <div class="summary-item" *ngIf="shipment.trackingNumber">
            <span class="summary-label">Tracking #</span>
            <span class="summary-value mono">{{ shipment.trackingNumber }}</span>
          </div>
          <div class="summary-item" *ngIf="shipment.estimatedDelivery">
            <span class="summary-label">Est. Delivery</span>
            <span class="summary-value" [class.overdue]="isOverdue()">
              {{ shipment.estimatedDelivery | date:'EEE, MMM d, y' }}
            </span>
          </div>
          <div class="summary-item" *ngIf="shipment.deliveryAddress">
            <span class="summary-label">Delivering to</span>
            <span class="summary-value">{{ shipment.deliveryAddress }}</span>
          </div>
        </div>

        <div *ngIf="shipment.lastStatusNote" class="status-note">
          <span class="note-icon">&#128274;</span>
          {{ shipment.lastStatusNote }}
        </div>

        <div *ngIf="shipment.carrierTrackingUrl" class="carrier-track-btn">
          <a [href]="shipment.carrierTrackingUrl" target="_blank" class="primary-btn">
            Track with {{ shipment.carrier || 'Carrier' }} &#8594;
          </a>
        </div>

        <!-- Amazon-style timeline -->
        <div class="timeline-section">
          <h3>Shipment Progress</h3>
          <div class="timeline" *ngIf="!isException()">
            <div class="timeline-step"
                 *ngFor="let step of timelineSteps; let i = index"
                 [ngClass]="stepClass(step.status)">
              <div class="step-icon-wrap">
                <div class="step-icon">{{ step.icon }}</div>
                <div class="step-line" *ngIf="i < timelineSteps.length - 1"></div>
              </div>
              <div class="step-body">
                <div class="step-label">{{ step.label }}</div>
                <div class="step-time" *ngIf="getEventTime(step.status) as t">
                  {{ t | date:'MMM d, HH:mm' }}
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="isException()" class="exception-banner">
            <span class="exc-icon">&#9888;</span>
            <strong>{{ formatStatus(shipment.status) }}</strong>
            <p>{{ shipment.lastStatusNote }}</p>
          </div>
        </div>

        <!-- Full event history -->
        <div class="events-section" *ngIf="events.length > 0">
          <h3>Detailed History</h3>
          <div class="event-list">
            <div class="event-item" *ngFor="let e of events">
              <div class="event-time">{{ e.eventTime | date:'MMM d, HH:mm' }}</div>
              <div class="event-body">
                <div class="event-type">{{ formatStatus(e.eventType) }}</div>
                <div class="event-desc">{{ e.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tracking-container { max-width: 760px; margin: 0 auto; padding: 24px 16px; font-family: Arial, sans-serif; }
    .back-btn { background: none; border: 1px solid #ccc; border-radius: 4px; padding: 6px 14px; cursor: pointer; color: #0066c0; font-size: 14px; margin-bottom: 20px; }
    .back-btn:hover { background: #f7f7f7; }
    .primary-btn { display: inline-block; background: #ff9900; color: #111; border: none; border-radius: 4px; padding: 8px 18px; cursor: pointer; text-decoration: none; font-weight: 600; font-size: 14px; }
    .primary-btn:hover { background: #e88b00; }

    .loading-state { text-align: center; padding: 60px 20px; color: #666; }
    .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #ff9900; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error-state { text-align: center; padding: 60px 20px; }
    .error-icon { font-size: 60px; margin-bottom: 16px; }

    .tracking-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #ddd; }
    .order-label { font-size: 20px; font-weight: 700; color: #111; }
    .shipment-number { font-size: 13px; color: #666; margin-top: 4px; }

    .status-badge { padding: 6px 14px; border-radius: 16px; font-weight: 700; font-size: 13px; }
    .badge-active { background: #cfe2ff; color: #084298; }
    .badge-delivered { background: #c8e6c9; color: #1b5e20; }
    .badge-exception { background: #ffebee; color: #b71c1c; }

    .tracking-summary { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 20px; padding: 16px; background: #f8f8f8; border-radius: 8px; }
    .summary-item { display: flex; flex-direction: column; gap: 2px; min-width: 140px; }
    .summary-label { font-size: 11px; color: #888; text-transform: uppercase; font-weight: 600; }
    .summary-value { font-size: 14px; color: #111; font-weight: 500; }
    .summary-value.mono { font-family: monospace; }
    .overdue { color: #d32f2f; font-weight: 700; }

    .status-note { padding: 12px 16px; background: #fff8e1; border-left: 4px solid #ff9900; border-radius: 4px; margin-bottom: 16px; font-size: 14px; color: #555; }
    .note-icon { margin-right: 6px; }

    .carrier-track-btn { margin-bottom: 24px; }

    .timeline-section h3, .events-section h3 { font-size: 16px; font-weight: 700; color: #111; margin: 24px 0 16px; }
    .timeline { display: flex; gap: 0; overflow-x: auto; padding-bottom: 8px; }
    .timeline-step { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 80px; }
    .step-icon-wrap { display: flex; align-items: center; width: 100%; }
    .step-icon { width: 36px; height: 36px; border-radius: 50%; background: #e0e0e0; display: flex; align-items: center; justify-content: center; font-size: 18px; z-index: 1; flex-shrink: 0; }
    .step-line { flex: 1; height: 3px; background: #e0e0e0; }
    .step-body { text-align: center; margin-top: 8px; padding: 0 4px; }
    .step-label { font-size: 11px; color: #666; font-weight: 500; }
    .step-time { font-size: 10px; color: #0066c0; margin-top: 2px; }

    .step-completed .step-icon { background: #2e7d32; color: white; }
    .step-completed .step-line { background: #2e7d32; }
    .step-completed .step-label { color: #2e7d32; font-weight: 700; }
    .step-current .step-icon { background: #ff9900; color: white; box-shadow: 0 0 0 4px #fff8e1; animation: pulse 1.5s infinite; }
    .step-current .step-label { color: #e65100; font-weight: 700; }
    @keyframes pulse { 0%,100% { box-shadow: 0 0 0 4px #fff8e1; } 50% { box-shadow: 0 0 0 8px #ffe0b2; } }

    .exception-banner { background: #ffebee; border: 1px solid #ef9a9a; border-radius: 8px; padding: 20px; text-align: center; }
    .exc-icon { font-size: 32px; display: block; margin-bottom: 8px; }
    .exception-banner strong { font-size: 18px; color: #b71c1c; }
    .exception-banner p { color: #555; margin-top: 8px; }

    .event-list { display: flex; flex-direction: column; gap: 0; }
    .event-item { display: flex; gap: 16px; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
    .event-time { font-size: 12px; color: #888; min-width: 90px; padding-top: 2px; }
    .event-type { font-weight: 600; font-size: 14px; color: #111; }
    .event-desc { font-size: 13px; color: #555; margin-top: 2px; }
  `]
})
export class OrderTrackingComponent implements OnInit {
  orderId = '';
  shipment: Shipment | null = null;
  events: ShipmentEvent[] = [];
  loading = true;
  error = '';
  timelineSteps = TIMELINE_STEPS;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.orderId) { this.error = 'Invalid order ID.'; this.loading = false; return; }
    this.loadShipment();
  }

  loadShipment() {
    this.http.get<Shipment>(`/api/shipments/order/${this.orderId}`).subscribe({
      next: (s) => {
        this.shipment = s;
        if (s.id) { this.loadEvents(s.id); } else { this.loading = false; }
      },
      error: () => {
        this.error = 'No shipment information available for this order yet.';
        this.loading = false;
      }
    });
  }

  loadEvents(id: number) {
    this.http.get<ShipmentEvent[]>(`/api/shipments/${id}/events`).subscribe({
      next: (ev) => { this.events = ev; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  goBack() { this.router.navigate(['/orders']); }

  formatStatus(s: string): string { return s ? s.replace(/_/g, ' ') : ''; }

  statusClass(s: string): string {
    if (s === 'DELIVERED') return 'delivered';
    if (EXCEPTION_STATUSES.includes(s)) return 'exception';
    return 'active';
  }

  isException(): boolean {
    return this.shipment ? EXCEPTION_STATUSES.includes(this.shipment.status) : false;
  }

  isOverdue(): boolean {
    if (!this.shipment?.estimatedDelivery || this.shipment.status === 'DELIVERED') return false;
    return new Date(this.shipment.estimatedDelivery) < new Date();
  }

  stepClass(stepStatus: string): string {
    if (!this.shipment) return '';
    const order = TIMELINE_STEPS.map(s => s.status);
    const currentIdx = order.indexOf(this.shipment.status);
    const stepIdx = order.indexOf(stepStatus);
    if (currentIdx === -1) return '';
    if (stepIdx < currentIdx) return 'step-completed';
    if (stepIdx === currentIdx) return 'step-current';
    return '';
  }

  getEventTime(status: string): string {
    const ev = this.events.find(e => e.eventType === status);
    return ev ? ev.eventTime : '';
  }
}
