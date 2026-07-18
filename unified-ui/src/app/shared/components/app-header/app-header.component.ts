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
  sideMenuOpen = false;

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
    { label: 'All', link: '', icon: 'menu' },
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

  // Sidebar menu sections
  sideMenuSections = [
    {
      title: 'Trending',
      items: [
        { label: 'Bestsellers', link: '/storefront/products?category=bestsellers' },
        { label: 'New Releases', link: '/storefront/products?category=new-releases' },
        { label: "Today's Deals", link: '/storefront/products?category=today-deals' },
      ],
    },
    {
      title: 'Shop by Category',
      items: [
        { label: 'Mobiles & Computers', link: '/storefront/products?category=mobiles' },
        { label: 'Electronics & Appliances', link: '/storefront/products?category=electronics' },
        { label: "Men's Fashion", link: '/storefront/products?category=fashion' },
        { label: "Women's Fashion", link: '/storefront/products?category=fashion' },
        { label: 'Home & Kitchen', link: '/storefront/products?category=home-kitchen' },
        { label: 'Sports & Fitness', link: '/storefront/products?category=sports-fitness' },
        { label: 'Beauty & Health', link: '/storefront/products?category=beauty' },
      ],
    },
    {
      title: 'Indian Specials',
      items: [
        { label: 'Ethnic Wear', link: '/storefront/products?category=fashion' },
        { label: 'Handloom & Handicrafts', link: '/storefront/products?category=home-kitchen' },
        { label: 'Spices & Groceries', link: '/storefront/products?category=home-kitchen' },
        { label: 'Ayurveda & Wellness', link: '/storefront/products?category=beauty' },
        { label: 'Jewelry & Accessories', link: '/storefront/products?category=fashion' },
      ],
    },
    {
      title: 'Help & Settings',
      items: [
        { label: 'Your Account', link: '/account' },
        { label: 'Your Orders', link: '/account/orders' },
        { label: 'Customer Service', link: '/home' },
      ],
    },
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
    if (!link) {
      // "All" button opens the side menu
      this.openSideMenu();
      return;
    }
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

  openSideMenu(): void {
    this.sideMenuOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeSideMenu(): void {
    this.sideMenuOpen = false;
    document.body.style.overflow = '';
  }

  onSideMenuItemClick(link: string): void {
    this.closeSideMenu();
    this.navigateToCategory(link);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
