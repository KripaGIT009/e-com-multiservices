import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CompareService {
  private compareItems = new BehaviorSubject<any[]>([]);
  public compareItems$ = this.compareItems.asObservable();
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      const stored = localStorage.getItem('compareItems');
      if (stored) {
        this.compareItems.next(JSON.parse(stored));
      }
    }
  }

  addToCompare(item: any): void {
    const current = this.compareItems.value;
    if (current.length < 4 && !current.find(i => i.id === item.id)) {
      const updated = [...current, item];
      this.compareItems.next(updated);
      if (this.isBrowser) {
        localStorage.setItem('compareItems', JSON.stringify(updated));
      }
    }
  }

  removeFromCompare(itemId: number): void {
    const current = this.compareItems.value.filter(i => i.id !== itemId);
    this.compareItems.next(current);
    if (this.isBrowser) {
      localStorage.setItem('compareItems', JSON.stringify(current));
    }
  }

  clearCompare(): void {
    this.compareItems.next([]);
    if (this.isBrowser) {
      localStorage.removeItem('compareItems');
    }
  }

  getCompareItems(): any[] {
    return this.compareItems.value;
  }
}
