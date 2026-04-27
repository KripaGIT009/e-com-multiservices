import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Shipment {
  id?: number;
  shipmentNumber: string;
  orderId: string;
  customerId?: string;
  status: string;
  carrier?: string;
  trackingNumber?: string;
  carrierTrackingUrl?: string;
  deliveryAddress?: string;
  estimatedDelivery?: string;
  lastStatusNote?: string;
  createdAt?: string;
}

export interface ShipmentEvent {
  id?: number;
  shipmentId: number;
  eventType: string;
  description: string;
  eventTime: string;
}

export interface UpdateStatusRequest {
  status?: string;
  trackingNumber?: string;
  carrier?: string;
  carrierTrackingUrl?: string;
  deliveryAddress?: string;
  estimatedDelivery?: string;
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class ShipmentService {
  private apiUrl = `${environment.apiUrl}/shipments`;

  constructor(private http: HttpClient) {}

  getAllShipments(): Observable<Shipment[]> {
    return this.http.get<Shipment[]>(this.apiUrl);
  }

  getShipment(id: number): Observable<Shipment> {
    return this.http.get<Shipment>(`${this.apiUrl}/${id}`);
  }

  trackShipment(trackingNumber: string): Observable<Shipment> {
    return this.http.get<Shipment>(`${environment.apiUrl}/track/${trackingNumber}`);
  }

  getShipmentEvents(id: number): Observable<ShipmentEvent[]> {
    return this.http.get<ShipmentEvent[]>(`${this.apiUrl}/${id}/events`);
  }

  updateStatus(id: number, request: UpdateStatusRequest): Observable<Shipment> {
    return this.http.put<Shipment>(`${this.apiUrl}/${id}/status`, request);
  }
}
