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
  estimatedDelivery?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
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
    return this.http.get<Shipment>(`${this.apiUrl}/track/${trackingNumber}`);
  }

  updateStatus(id: number, status: string): Observable<Shipment> {
    return this.http.put<Shipment>(`${this.apiUrl}/${id}/status`, { status });
  }
}
