import os

ts_content = """\
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
"""

html_content = """\
<mat-card class="shipment-card">
  <mat-card-header>
    <mat-card-title>
      <mat-icon style="vertical-align:middle;margin-right:8px">local_shipping</mat-icon>
      Shipments
    </mat-card-title>
    <div class="header-actions">
      <mat-form-field appearance="outline" style="width:220px">
        <mat-label>Search tracking / order</mat-label>
        <input matInput [(ngModel)]="searchQuery" (keyup.enter)="search()" placeholder="SHP-XXXXX">
        <mat-icon matSuffix style="cursor:pointer" (click)="search()">search</mat-icon>
      </mat-form-field>
      <mat-form-field appearance="outline" style="width:180px">
        <mat-label>Filter by status</mat-label>
        <mat-select [(ngModel)]="filterStatus" (selectionChange)="applyFilter()">
          <mat-option value="">All</mat-option>
          <mat-option *ngFor="let s of allStatuses" [value]="s">{{formatStatus(s)}}</mat-option>
        </mat-select>
      </mat-form-field>
      <button mat-stroked-button (click)="loadShipments()">
        <mat-icon>refresh</mat-icon> Refresh
      </button>
    </div>
  </mat-card-header>

  <mat-card-content>
    <table mat-table [dataSource]="filtered" class="shipments-table">

      <ng-container matColumnDef="shipmentNumber">
        <th mat-header-cell *matHeaderCellDef>Shipment #</th>
        <td mat-cell *matCellDef="let s">
          <strong>{{s.shipmentNumber}}</strong><br>
          <small class="muted">Order: {{s.orderId}}</small>
        </td>
      </ng-container>

      <ng-container matColumnDef="tracking">
        <th mat-header-cell *matHeaderCellDef>Tracking</th>
        <td mat-cell *matCellDef="let s">
          <span>{{s.trackingNumber || '—'}}</span><br>
          <small class="muted">{{s.carrier || 'STANDARD'}}</small>
          <a *ngIf="s.carrierTrackingUrl" [href]="s.carrierTrackingUrl" target="_blank"
             mat-icon-button matTooltip="Track with carrier">
            <mat-icon style="font-size:16px">open_in_new</mat-icon>
          </a>
        </td>
      </ng-container>

      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>Status</th>
        <td mat-cell *matCellDef="let s">
          <span class="status-badge" [ngClass]="'status-' + (s.status | lowercase)">
            {{formatStatus(s.status)}}
          </span>
          <div class="status-note" *ngIf="s.lastStatusNote">
            <small class="muted">{{s.lastStatusNote}}</small>
          </div>
        </td>
      </ng-container>

      <ng-container matColumnDef="eta">
        <th mat-header-cell *matHeaderCellDef>Est. Delivery</th>
        <td mat-cell *matCellDef="let s">
          <span [class.overdue]="isOverdue(s)">
            {{s.estimatedDelivery ? (s.estimatedDelivery | date:'MMM d, y') : '—'}}
          </span>
        </td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let s">
          <button mat-icon-button color="primary" (click)="openUpdatePanel(s)" matTooltip="Update shipment">
            <mat-icon>edit</mat-icon>
          </button>
          <button mat-icon-button (click)="toggleEvents(s)" matTooltip="View timeline">
            <mat-icon>timeline</mat-icon>
          </button>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns;"
          [class.selected-row]="selectedShipment?.id === row.id"
          (click)="selectRow(row)"></tr>
    </table>

    <mat-expansion-panel *ngIf="editShipment" class="edit-panel" [expanded]="true">
      <mat-expansion-panel-header>
        <mat-panel-title>Update Shipment: {{editShipment.shipmentNumber}}</mat-panel-title>
      </mat-expansion-panel-header>
      <div class="edit-form">
        <mat-form-field appearance="outline">
          <mat-label>New Status</mat-label>
          <mat-select [(ngModel)]="updateReq.status">
            <mat-option *ngFor="let s of allStatuses" [value]="s">{{formatStatus(s)}}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Carrier</mat-label>
          <input matInput [(ngModel)]="updateReq.carrier" placeholder="e.g. FedEx, UPS">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Tracking Number</mat-label>
          <input matInput [(ngModel)]="updateReq.trackingNumber">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Carrier Tracking URL</mat-label>
          <input matInput [(ngModel)]="updateReq.carrierTrackingUrl" placeholder="https://...">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Estimated Delivery Date</mat-label>
          <input matInput [(ngModel)]="updateReq.estimatedDelivery" type="datetime-local">
        </mat-form-field>
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Customer-facing Note</mat-label>
          <textarea matInput [(ngModel)]="updateReq.note" rows="2"
            placeholder="Leave blank for default message"></textarea>
        </mat-form-field>
        <div class="edit-actions">
          <button mat-raised-button color="primary" (click)="saveUpdate()" [disabled]="saving">
            <mat-icon>save</mat-icon> {{saving ? 'Saving...' : 'Save Changes'}}
          </button>
          <button mat-button (click)="editShipment = null">Cancel</button>
        </div>
      </div>
    </mat-expansion-panel>

    <mat-expansion-panel *ngIf="eventsShipment" class="events-panel" [expanded]="true">
      <mat-expansion-panel-header>
        <mat-panel-title>
          <mat-icon>timeline</mat-icon>&nbsp;Timeline: {{eventsShipment.shipmentNumber}}
        </mat-panel-title>
      </mat-expansion-panel-header>
      <div *ngIf="loadingEvents" class="loading">Loading events...</div>
      <div *ngIf="!loadingEvents && events.length === 0" class="muted">No events found.</div>
      <div class="event-timeline">
        <div class="event-item" *ngFor="let e of events">
          <div class="event-dot"></div>
          <div class="event-body">
            <strong>{{e.eventType}}</strong>
            <span class="event-desc">{{e.description}}</span>
            <small class="muted">{{e.eventTime | date:'MMM d, y HH:mm'}}</small>
          </div>
        </div>
      </div>
      <div style="margin-top:8px">
        <button mat-button (click)="eventsShipment = null">Close</button>
      </div>
    </mat-expansion-panel>
  </mat-card-content>
</mat-card>
"""

scss_content = """\
.shipment-card { margin: 20px; }
mat-card-header { display: flex; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
.header-actions { margin-left: auto; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.shipments-table { width: 100%; }
.muted { color: #888; font-size: 12px; }
.selected-row { background: #f0f7ff; }
.overdue { color: #d32f2f; font-weight: 600; }
.edit-panel, .events-panel { margin-top: 16px; }
.edit-form { display: flex; flex-wrap: wrap; gap: 16px; padding: 16px 0; }
.edit-form mat-form-field { min-width: 200px; flex: 1; }
.edit-actions { width: 100%; display: flex; gap: 8px; margin-top: 8px; }
.event-timeline { padding: 8px 0; }
.event-item { display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid #eee; }
.event-dot { width: 12px; height: 12px; border-radius: 50%; background: #1976d2; margin-top: 4px; flex-shrink: 0; }
.event-body { display: flex; flex-direction: column; gap: 2px; }
.event-desc { color: #555; font-size: 13px; }
.status-note { margin-top: 2px; }
.loading { padding: 16px; color: #888; }

.status-badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.status-order_placed    { background: #e3f2fd; color: #1565c0; }
.status-processing      { background: #fff8e1; color: #f57f17; }
.status-label_generated { background: #fff3e0; color: #e65100; }
.status-picked_up       { background: #f3e5f5; color: #6a1b9a; }
.status-in_transit      { background: #e8f5e9; color: #1b5e20; }
.status-out_for_delivery { background: #e0f2f1; color: #004d40; }
.status-attempted_delivery { background: #fff9c4; color: #827717; }
.status-delivered       { background: #c8e6c9; color: #1b5e20; }
.status-exception       { background: #ffebee; color: #b71c1c; }
.status-returned        { background: #fce4ec; color: #880e4f; }
"""

base = r'c:\projects\myindiansstore\ui-admin\src\app\components\shipment-list'

with open(os.path.join(base, 'shipment-list.component.ts'), 'w', encoding='utf-8') as f:
    f.write(ts_content)
print('TS written:', len(ts_content))

with open(os.path.join(base, 'shipment-list.component.html'), 'w', encoding='utf-8') as f:
    f.write(html_content)
print('HTML written:', len(html_content))

with open(os.path.join(base, 'shipment-list.component.scss'), 'w', encoding='utf-8') as f:
    f.write(scss_content)
print('SCSS written:', len(scss_content))
