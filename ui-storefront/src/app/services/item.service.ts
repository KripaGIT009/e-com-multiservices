import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Item } from '../models/item.model';

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private apiUrl = '/api/items';

  constructor(private http: HttpClient) { }

  getItems(): Observable<Item[]> {
    return this.http.get<Item[]>(this.apiUrl).pipe(
      map(items => items.map(item => this.normalizeItem(item)))
    );
  }

  getAllItems(): Observable<Item[]> {
    return this.getItems();
  }

  getItem(id: string): Observable<Item> {
    return this.http.get<Item>(`${this.apiUrl}/${id}`).pipe(
      map(item => this.normalizeItem(item))
    );
  }

  createItem(item: Partial<Item>): Observable<Item> {
    return this.http.post<Item>(this.apiUrl, item).pipe(
      map(createdItem => this.normalizeItem(createdItem))
    );
  }

  updateItem(id: string, item: Partial<Item>): Observable<Item> {
    return this.http.put<Item>(`${this.apiUrl}/${id}`, item).pipe(
      map(updatedItem => this.normalizeItem(updatedItem))
    );
  }

  deleteItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private normalizeItem(item: Item): Item {
    return {
      ...item,
      stock: item.stock ?? item.quantity ?? 0
    };
  }
}
