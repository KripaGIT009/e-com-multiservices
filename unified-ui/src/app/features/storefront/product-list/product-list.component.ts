import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  originalPrice?: number;
  discount?: number;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  sponsored?: boolean;
  freeDelivery?: boolean;
}

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  isLoading = true;

  // Filter properties
  priceMin: string = '';
  priceMax: string = '';
  selectedPriceRanges: string[] = [];
  selectedRatings: number[] = [];
  selectedDiscounts: string[] = [];
  sortBy = 'featured';

  // Search/category context
  currentCategory = '';
  searchQuery = '';
  totalResults = 0;

  priceRanges = [
    { label: 'Under ₹500', value: 'under-500', min: 0, max: 500 },
    { label: '₹500 - ₹1,000', value: '500-1000', min: 500, max: 1000 },
    { label: '₹1,000 - ₹2,000', value: '1000-2000', min: 1000, max: 2000 },
    { label: 'Over ₹2,000', value: 'over-2000', min: 2000, max: Infinity },
  ];

  discountOptions = [
    { label: '10% Off or more', value: '10' },
    { label: '25% Off or more', value: '25' },
    { label: '35% Off or more', value: '35' },
    { label: '50% Off or more', value: '50' },
  ];

  sortOptions = [
    { label: 'Featured', value: 'featured' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Avg. Customer Review', value: 'rating' },
    { label: 'Newest Arrivals', value: 'newest' },
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.currentCategory = params['category'] || '';
      this.searchQuery = params['search'] || '';
      this.loadProducts();
    });
  }

  get displayCategory(): string {
    if (this.searchQuery) {
      return this.searchQuery;
    }
    if (this.currentCategory) {
      return this.currentCategory.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return 'All Products';
  }

  private loadProducts(): void {
    this.isLoading = true;

    // Server-side search/category so the header search box and the ~30 category
    // links actually narrow the list; previously every one of them showed everything.
    const hasQuery = !!(this.searchQuery || this.currentCategory);
    let request = '/api/items';
    if (hasQuery) {
      const params: string[] = [];
      if (this.searchQuery) params.push(`q=${encodeURIComponent(this.searchQuery)}`);
      if (this.currentCategory) params.push(`category=${encodeURIComponent(this.currentCategory)}`);
      request = `/api/items/search?${params.join('&')}`;
    }

    this.http.get<Product[]>(request).subscribe({
      next: (items) => {
        this.products = items.map((item) => this.toDisplayProduct(item));
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.show('Failed to load products.', 'error');
      },
    });
  }

  /**
   * Derives the display fields the catalogue API does not yet provide.
   *
   * Everything here is a deterministic function of the product itself. The previous
   * version used Math.random(), so ratings, review counts, discount badges and even
   * stock status changed on every page load, and the discount badge contradicted the
   * M.R.P. shown beside it.
   */
  private toDisplayProduct(item: Product): Product {
    const inStock = (item as unknown as { quantity?: number }).quantity !== 0;
    const originalPrice = item.price ? Math.round(item.price * 1.3) : undefined;
    const discount =
      originalPrice && item.price
        ? Math.round(((originalPrice - item.price) / originalPrice) * 100)
        : undefined;

    return {
      ...item,
      imageUrl: item.imageUrl || this.getProductImage(item.name, item.category, item.id),
      originalPrice,
      discount,
      inStock,
      // Ratings belong to review-service; show none until it can supply them
      // rather than inventing a number the customer would read as real.
      rating: undefined,
      reviewCount: undefined,
      sponsored: false,
      freeDelivery: true,
    };
  }

  private getProductImage(name: string, category: string, id: number): string {
    const seed = (name || category || 'product').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) + id;
    return `https://picsum.photos/seed/${seed}/300/300`;
  }

  applyFilters(): void {
    let filtered = [...this.products];

    // Filter by price range checkboxes
    if (this.selectedPriceRanges.length > 0) {
      filtered = filtered.filter((product) =>
        this.selectedPriceRanges.some((rangeValue) => {
          const range = this.priceRanges.find((r) => r.value === rangeValue);
          return range && product.price >= range.min && product.price < range.max;
        })
      );
    }

    // Filter by min/max price
    if (this.priceMin) {
      filtered = filtered.filter((p) => p.price >= +this.priceMin);
    }
    if (this.priceMax) {
      filtered = filtered.filter((p) => p.price <= +this.priceMax);
    }

    // Filter by rating
    if (this.selectedRatings.length > 0) {
      const minRating = Math.min(...this.selectedRatings);
      filtered = filtered.filter((p) => (p.rating || 0) >= minRating);
    }

    // Filter by discount
    if (this.selectedDiscounts.length > 0) {
      const minDiscount = Math.min(...this.selectedDiscounts.map(Number));
      filtered = filtered.filter((p) => (p.discount || 0) >= minDiscount);
    }

    // Sort
    switch (this.sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => b.id - a.id);
        break;
    }

    this.filteredProducts = filtered;
    this.totalResults = filtered.length;
  }

  onPriceRangeChange(value: string, checked: boolean): void {
    if (checked) {
      this.selectedPriceRanges.push(value);
    } else {
      this.selectedPriceRanges = this.selectedPriceRanges.filter((v) => v !== value);
    }
    this.applyFilters();
  }

  onRatingChange(rating: number, checked: boolean): void {
    if (checked) {
      this.selectedRatings.push(rating);
    } else {
      this.selectedRatings = this.selectedRatings.filter((r) => r !== rating);
    }
    this.applyFilters();
  }

  onDiscountChange(value: string, checked: boolean): void {
    if (checked) {
      this.selectedDiscounts.push(value);
    } else {
      this.selectedDiscounts = this.selectedDiscounts.filter((v) => v !== value);
    }
    this.applyFilters();
  }

  applyPriceFilter(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.round(rating) ? 1 : 0);
  }

  viewProduct(id: number): void {
    this.router.navigate(['/storefront/products', id]);
  }

  addToCart(product: Product, event: Event): void {
    event.stopPropagation();
    const userId = this.authService.currentUser?.id || 'guest-user';
    this.http.post(`/api/cart/${userId}/items`, { itemId: product.id, quantity: 1 }).subscribe({
      next: () => {
        this.notificationService.show(`${product.name} added to cart!`, 'success');
      },
      error: () => {
        this.notificationService.show('Failed to add item to cart.', 'error');
      },
    });
  }
}
