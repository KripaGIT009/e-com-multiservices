import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface InventoryItem {
  id?: number;
  itemId: number;
  itemName?: string;
  quantity: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  location?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiUrl = `${environment.apiUrl}/inventory`;

  constructor(private http: HttpClient) {}

  getAllInventory(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(this.apiUrl);
  }

  getInventoryByItem(itemId: number): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(`${this.apiUrl}/item/${itemId}`);
  }

  updateStock(itemId: number, quantity: number): Observable<InventoryItem> {
    return this.http.put<InventoryItem>(`${this.apiUrl}/${itemId}`, { quantity });
  }
}
