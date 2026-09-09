import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { productPlaceholder } from '../../../core/utils/product-image';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
}

interface ShopCategory {
  name: string;
  subtitle: string;
  /** Material Icons ligature. */
  icon: string;
  /** Tile tint, 1-6, cycling through the brand-derived palette. */
  tone: number;
  link: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  featuredProducts: Product[] = [];
  isLoading = true;

  shopCategories: ShopCategory[] = [
    {
      name: 'Ethnic Wear',
      subtitle: 'Sarees, Kurtas & Lehengas',
      icon: 'checkroom',
      tone: 1,
      link: '/storefront/products?category=fashion',
    },
    {
      name: 'Spices & Masalas',
      subtitle: 'Authentic Indian flavours',
      icon: 'restaurant',
      tone: 2,
      link: '/storefront/products?category=home-kitchen',
    },
    {
      name: 'Electronics',
      subtitle: 'Phones, laptops & gadgets',
      icon: 'devices',
      tone: 3,
      link: '/storefront/products?category=electronics',
    },
    {
      name: 'Handcrafted Decor',
      subtitle: 'Artisan home decor',
      icon: 'chair',
      tone: 4,
      link: '/storefront/products?category=home-kitchen',
    },
    {
      name: 'Ayurveda & Wellness',
      subtitle: 'Natural health products',
      icon: 'spa',
      tone: 5,
      link: '/storefront/products?category=beauty',
    },
    {
      name: 'Jewellery',
      subtitle: 'Traditional & modern',
      icon: 'diamond',
      tone: 6,
      link: '/storefront/products?category=fashion',
    },
    {
      name: 'Cricket & Sports',
      subtitle: 'Gear & equipment',
      icon: 'sports_cricket',
      tone: 1,
      link: '/storefront/products?category=sports-fitness',
    },
    {
      name: 'Books & Stationery',
      subtitle: 'Bestsellers & more',
      icon: 'menu_book',
      tone: 2,
      link: '/storefront/products?category=books',
    },
  ];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadFeaturedProducts();
  }

  private loadFeaturedProducts(): void {
    this.http.get<Product[]>('/api/items').subscribe({
      next: (items) => {
        this.featuredProducts = items.slice(0, 8).map((item) => ({
          ...item,
          imageUrl: item.imageUrl || productPlaceholder(item.name, item.id),
        }));
        // If no products from API, show dummy products
        if (this.featuredProducts.length === 0) {
          this.featuredProducts = this.getDummyProducts();
        }
        this.isLoading = false;
      },
      error: () => {
        this.featuredProducts = this.getDummyProducts();
        this.isLoading = false;
      },
    });
  }

  /** Shown only when the catalogue API is unreachable, so the page is never blank. */
  private getDummyProducts(): Product[] {
    return ([
      { id: 1, name: 'Banarasi Silk Saree', description: 'Pure silk with gold zari', price: 4500, imageUrl: '', category: 'fashion' },
      { id: 2, name: 'Ethnic Kurta - Men', description: 'Cotton printed kurta', price: 899, imageUrl: '', category: 'fashion' },
      { id: 3, name: 'Garam Masala Premium 200g', description: 'Blend of 12 spices', price: 199, imageUrl: '', category: 'home-kitchen' },
      { id: 4, name: 'Brass Diya Set', description: 'Traditional oil lamp set of 4', price: 650, imageUrl: '', category: 'home-kitchen' },
      { id: 5, name: 'Wireless Earbuds Pro', description: 'Active noise cancellation', price: 2999, imageUrl: '', category: 'electronics' },
      { id: 6, name: 'Anarkali Suit - Women', description: 'Embroidered floor length', price: 2200, imageUrl: '', category: 'fashion' },
      { id: 7, name: 'Cricket Bat - English Willow', description: 'Tournament grade', price: 3499, imageUrl: '', category: 'sports-fitness' },
      { id: 8, name: 'Organic Turmeric Powder 500g', description: 'Premium Lakadong turmeric', price: 349, imageUrl: '', category: 'home-kitchen' },
    ] as Product[]).map((p) => ({ ...p, imageUrl: productPlaceholder(p.name, p.id) }));
  }

  navigateToProducts(): void {
    this.router.navigate(['/storefront/products']);
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

  viewProduct(id: number): void {
    this.router.navigate(['/storefront/products', id]);
  }
}
