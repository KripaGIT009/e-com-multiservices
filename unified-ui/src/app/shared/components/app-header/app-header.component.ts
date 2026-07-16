import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { AuthUser } from '../../../core/models/auth.models';

@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
})
export class AppHeaderComponent implements OnInit, OnDestroy {
  currentUser: AuthUser | null = null;
  mobileMenuOpen = false;

  // Amazon-style header properties
  searchQuery = '';
  selectedCategory = 'All';
  cartCount = 0;

  categories: string[] = [
    'All',
    'Electronics',
    'Fashion',
    'Home & Kitchen',
    'Sports & Fitness',
    'Mobiles',
    'Books',
    'Toys & Games',
    'Beauty',
  ];

  navCategories: Array<{ label: string; link: string; icon?: string }> = [
    { label: 'All', link: '/storefront/products', icon: 'menu' },
    { label: 'Bestsellers', link: '/storefront/products?category=bestsellers' },
    { label: 'Mobiles', link: '/storefront/products?category=mobiles' },
    { label: 'Electronics', link: '/storefront/products?category=electronics' },
    { label: 'Fashion', link: '/storefront/products?category=fashion' },
    { label: 'Home & Kitchen', link: '/storefront/products?category=home-kitchen' },
    { label: 'Sports & Fitness', link: '/storefront/products?category=sports-fitness' },
    { label: 'Books', link: '/storefront/products?category=books' },
    { label: 'Toys & Games', link: '/storefront/products?category=toys-games' },
    { label: 'Beauty', link: '/storefront/products?category=beauty' },
    { label: "Today's Deals", link: '/storefront/products?category=today-deals' },
    { label: 'New Releases', link: '/storefront/products?category=new-releases' },
  ];

  private userSubscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(
      (user) => (this.currentUser = user)
    );
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  get isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }

  get displayName(): string {
    return this.currentUser?.username || 'Guest';
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/storefront/products'], {
        queryParams: {
          search: this.searchQuery.trim(),
          category: this.selectedCategory !== 'All' ? this.selectedCategory : undefined,
        },
      });
    }
  }

  navigateToCategory(link: string): void {
    const [path, queryString] = link.split('?');
    if (queryString) {
      const params: Record<string, string> = {};
      queryString.split('&').forEach((param) => {
        const [key, value] = param.split('=');
        params[key] = value;
      });
      this.router.navigate([path], { queryParams: params });
    } else {
      this.router.navigate([path]);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
