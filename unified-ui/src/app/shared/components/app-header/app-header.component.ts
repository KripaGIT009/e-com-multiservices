import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
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
  accountMenuOpen = false;

  /**
   * Account menu.
   *
   * `route` is a working destination. `pending` marks an entry whose backing service
   * is not built yet — those render as disabled with the reason, rather than as links
   * that look live and go nowhere. See docs/service-catalog.md for the roadmap.
   */
  accountMenuSections: Array<{
    title: string;
    items: Array<{ label: string; route?: string; pending?: string }>;
  }> = [
    {
      title: 'Your Lists',
      items: [
        { label: 'Your Wish List', route: '/account/wishlist' },
        { label: 'Keep shopping for', route: '/account/recently-viewed' },
        { label: 'Your Recommendations', pending: 'recommendation-service' },
        { label: 'Your Subscribe & Save Items', pending: 'subscription billing' },
      ],
    },
    {
      title: 'Your Account',
      items: [
        { label: 'Your Account', route: '/account' },
        { label: 'Your Orders', route: '/account/orders' },
        { label: 'Memberships & Subscriptions', pending: 'subscription billing' },
        { label: 'Your Seller Account', route: '/seller' },
        { label: 'Manage Your Content and Devices', pending: 'digital content' },
        { label: 'Your Music Library', pending: 'digital content' },
        { label: 'Register for a free Business Account', route: '/seller/register' },
      ],
    },
  ];

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
  private cartSubscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router,
    private host: ElementRef<HTMLElement>
  ) {}

  /** Current location, so sign-in can return here afterwards. */
  get returnUrl(): string {
    return this.router.url;
  }

  toggleAccountMenu(event: Event): void {
    event.stopPropagation();
    this.accountMenuOpen = !this.accountMenuOpen;
  }

  closeAccountMenu(): void {
    this.accountMenuOpen = false;
  }

  onAccountMenuItem(item: { route?: string; pending?: string }): void {
    if (!item.route) return;          // pending entries are inert
    this.closeAccountMenu();
    this.router.navigate([item.route]);
  }

  // Clicking anywhere else, or pressing Escape, dismisses the menu.
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.accountMenuOpen && !this.host.nativeElement.contains(event.target as Node)) {
      this.closeAccountMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeAccountMenu();
  }

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      // The cart is keyed to the caller, so reload it whenever identity changes.
      this.cartService.refresh();
    });
    this.cartSubscription = this.cartService.itemCount$.subscribe(
      (count) => (this.cartCount = count)
    );
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.cartSubscription?.unsubscribe();
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
