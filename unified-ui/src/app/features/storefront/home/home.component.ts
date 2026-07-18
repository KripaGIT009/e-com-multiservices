import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

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
  image: string;
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
      name: 'Electronics',
      subtitle: 'Gadgets & Accessories',
      image: 'https://picsum.photos/seed/electronics/300/200',
      link: '/storefront/products?category=electronics',
    },
    {
      name: 'Fashion',
      subtitle: 'Clothing & Trends',
      image: 'https://picsum.photos/seed/fashion/300/200',
      link: '/storefront/products?category=fashion',
    },
    {
      name: 'Home & Kitchen',
      subtitle: 'Essentials & Decor',
      image: 'https://picsum.photos/seed/kitchen/300/200',
      link: '/storefront/products?category=home-kitchen',
    },
    {
      name: 'Sports & Fitness',
      subtitle: 'Gear & Equipment',
      image: 'https://picsum.photos/seed/sports/300/200',
      link: '/storefront/products?category=sports-fitness',
    },
    {
      name: 'Mobiles & Tablets',
      subtitle: 'Phones & Tablets',
      image: 'https://picsum.photos/seed/mobiles/300/200',
      link: '/storefront/products?category=mobiles',
    },
    {
      name: 'Books',
      subtitle: 'Bestsellers & New',
      image: 'https://picsum.photos/seed/books/300/200',
      link: '/storefront/products?category=books',
    },
    {
      name: 'Beauty',
      subtitle: 'Skincare & Makeup',
      image: 'https://picsum.photos/seed/beauty/300/200',
      link: '/storefront/products?category=beauty',
    },
    {
      name: 'Toys & Games',
      subtitle: 'Fun for Everyone',
      image: 'https://picsum.photos/seed/toys/300/200',
      link: '/storefront/products?category=toys-games',
    },
  ];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadFeaturedProducts();
  }

  private loadFeaturedProducts(): void {
    this.http.get<Product[]>('/api/items').subscribe({
      next: (items) => {
        this.featuredProducts = items.slice(0, 8).map((item, index) => ({
          ...item,
          imageUrl: item.imageUrl || `https://picsum.photos/seed/product${item.id || index}/300/300`,
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

  private getDummyProducts(): Product[] {
    return [
      { id: 1, name: 'Wireless Bluetooth Headphones', description: 'Premium sound quality', price: 2499, imageUrl: 'https://picsum.photos/seed/headphones/300/300', category: 'electronics' },
      { id: 2, name: 'Cotton Kurta Set', description: 'Traditional Indian wear', price: 1299, imageUrl: 'https://picsum.photos/seed/kurta/300/300', category: 'fashion' },
      { id: 3, name: 'Stainless Steel Cookware Set', description: '5-piece premium set', price: 3999, imageUrl: 'https://picsum.photos/seed/cookware/300/300', category: 'home-kitchen' },
      { id: 4, name: 'Yoga Mat Premium', description: 'Non-slip exercise mat', price: 899, imageUrl: 'https://picsum.photos/seed/yogamat/300/300', category: 'sports-fitness' },
      { id: 5, name: 'Smart Watch Pro', description: 'Fitness tracker with GPS', price: 4999, imageUrl: 'https://picsum.photos/seed/smartwatch/300/300', category: 'electronics' },
      { id: 6, name: 'Organic Green Tea', description: '100 tea bags pack', price: 599, imageUrl: 'https://picsum.photos/seed/greentea/300/300', category: 'home-kitchen' },
      { id: 7, name: 'Running Shoes', description: 'Lightweight sports shoes', price: 3499, imageUrl: 'https://picsum.photos/seed/shoes/300/300', category: 'sports-fitness' },
      { id: 8, name: 'Portable Bluetooth Speaker', description: 'Waterproof 20W speaker', price: 1999, imageUrl: 'https://picsum.photos/seed/speaker/300/300', category: 'electronics' },
    ];
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
