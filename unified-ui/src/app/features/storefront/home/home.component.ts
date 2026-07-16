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
      image: 'https://via.placeholder.com/300x200?text=Electronics',
      link: '/storefront/products?category=electronics',
    },
    {
      name: 'Fashion',
      subtitle: 'Clothing & Trends',
      image: 'https://via.placeholder.com/300x200?text=Fashion',
      link: '/storefront/products?category=fashion',
    },
    {
      name: 'Home & Kitchen',
      subtitle: 'Essentials & Decor',
      image: 'https://via.placeholder.com/300x200?text=Home+%26+Kitchen',
      link: '/storefront/products?category=home-kitchen',
    },
    {
      name: 'Sports & Fitness',
      subtitle: 'Gear & Equipment',
      image: 'https://via.placeholder.com/300x200?text=Sports+%26+Fitness',
      link: '/storefront/products?category=sports-fitness',
    },
    {
      name: 'Mobiles & Tablets',
      subtitle: 'Phones & Tablets',
      image: 'https://via.placeholder.com/300x200?text=Mobiles+%26+Tablets',
      link: '/storefront/products?category=mobiles',
    },
  ];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadFeaturedProducts();
  }

  private loadFeaturedProducts(): void {
    this.http.get<Product[]>('/api/items').subscribe({
      next: (items) => {
        this.featuredProducts = items.slice(0, 8);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
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
