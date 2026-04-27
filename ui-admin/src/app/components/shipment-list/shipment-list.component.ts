import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { ShipmentService, Shipment, ShipmentEvent, UpdateStatusRequest } from '../../services/shipment.service';

const ALL_STATUSES = [
  'ORDER_PLACED', 'PROCESSING', 'LABEL_GENERATED', 'PICKED_UP',
  'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'ATTEMPTED_DELIVERY',
  'DELIVERED', 'EXCEPTION', 'RETURNED'
];

@Component({
  selector: 'app-shipment-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatExpansionModule, MatSnackBarModule, MatTooltipModule, MatDividerModule
  ],
  templateUrl: './shipment-list.component.html',
  styleUrls: ['./shipment-list.component.scss']
})
export class ShipmentListComponent implements OnInit {
  allStatuses = ALL_STATUSES;
  columns = ['shipmentNumber', 'tracking', 'status', 'eta', 'actions'];

  all: Shipment[] = [];
  filtered: Shipment[] = [];
  searchQuery = '';
  filterStatus = '';

  editShipment: Shipment | null = null;
  updateReq: UpdateStatusRequest = {};
  saving = false;

  selectedShipment: Shipment | null = null;
  eventsShipment: Shipment | null = null;
  events: ShipmentEvent[] = [];
  loadingEvents = false;

  constructor(
    private shipmentService: ShipmentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() { this.loadShipments(); }

  loadShipments() {
    this.shipmentService.getAllShipments().subscribe({
      next: (data) => { this.all = data; this.applyFilter(); },
      error: () => this.snackBar.open('Error loading shipments', 'Close', { duration: 3000 })
    });
  }

  applyFilter() {
    let list = this.all;
    if (this.filterStatus) list = list.filter(s => s.status === this.filterStatus);
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(s =>
        (s.shipmentNumber || '').toLowerCase().includes(q) ||
        (s.trackingNumber || '').toLowerCase().includes(q) ||
        (s.orderId || '').toLowerCase().includes(q)
      );
    }
    this.filtered = list;
  }

  search() {
    if (this.searchQuery && this.searchQuery.length > 3) {
      this.shipmentService.trackShipment(this.searchQuery).subscribe({
        next: (s) => { this.all = [s]; this.applyFilter(); },
        error: () => this.applyFilter()
      });
    } else {
      this.applyFilter();
    }
  }

  selectRow(s: Shipment) { this.selectedShipment = s; }

  openUpdatePanel(s: Shipment) {
    this.editShipment = s;
    this.eventsShipment = null;
    this.updateReq = {
      status: s.status,
      carrier: s.carrier,
      trackingNumber: s.trackingNumber,
      carrierTrackingUrl: s.carrierTrackingUrl,
      estimatedDelivery: s.estimatedDelivery ? s.estimatedDelivery.substring(0, 16) : undefined
    };
  }

  saveUpdate() {
    if (!this.editShipment || !this.editShipment.id) return;
    this.saving = true;
    this.shipmentService.updateStatus(this.editShipment.id, this.updateReq).subscribe({
      next: (updated) => {
        const idx = this.all.findIndex(s => s.id === updated.id);
        if (idx >= 0) this.all[idx] = updated;
        this.applyFilter();
        this.editShipment = null;
        this.saving = false;
        this.snackBar.open('Shipment updated', 'Close', { duration: 2000 });
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Failed to update shipment', 'Close', { duration: 3000 });
      }
    });
  }

  toggleEvents(s: Shipment) {
    if (this.eventsShipment && this.eventsShipment.id === s.id) {
      this.eventsShipment = null;
      return;
    }
    this.eventsShipment = s;
    this.editShipment = null;
    this.events = [];
    if (!s.id) return;
    this.loadingEvents = true;
    this.shipmentService.getShipmentEvents(s.id).subscribe({
      next: (ev) => { this.events = ev; this.loadingEvents = false; },
      error: () => { this.loadingEvents = false; }
    });
  }

  formatStatus(s: string): string {
    return s ? s.replace(/_/g, ' ') : '';
  }

  isOverdue(s: Shipment): boolean {
    if (!s.estimatedDelivery || s.status === 'DELIVERED') return false;
    return new Date(s.estimatedDelivery) < new Date();
  }
}
