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
      name: 'Ethnic Wear',
      subtitle: 'Sarees, Kurtas & Lehengas',
      image: 'https://picsum.photos/seed/ethnicwear/300/200',
      link: '/storefront/products?category=fashion',
    },
    {
      name: 'Spices & Masalas',
      subtitle: 'Authentic Indian Flavors',
      image: 'https://picsum.photos/seed/indianspices/300/200',
      link: '/storefront/products?category=home-kitchen',
    },
    {
      name: 'Electronics',
      subtitle: 'Phones, Laptops & Gadgets',
      image: 'https://picsum.photos/seed/indiaelectronics/300/200',
      link: '/storefront/products?category=electronics',
    },
    {
      name: 'Handcrafted Decor',
      subtitle: 'Artisan Home Decor',
      image: 'https://picsum.photos/seed/indiandecor/300/200',
      link: '/storefront/products?category=home-kitchen',
    },
    {
      name: 'Ayurveda & Wellness',
      subtitle: 'Natural Health Products',
      image: 'https://picsum.photos/seed/ayurveda/300/200',
      link: '/storefront/products?category=beauty',
    },
    {
      name: 'Jewelry & Accessories',
      subtitle: 'Traditional & Modern',
      image: 'https://picsum.photos/seed/indianjewelry/300/200',
      link: '/storefront/products?category=fashion',
    },
    {
      name: 'Cricket & Sports',
      subtitle: 'Gear & Equipment',
      image: 'https://picsum.photos/seed/cricketsports/300/200',
      link: '/storefront/products?category=sports-fitness',
    },
    {
      name: 'Books & Stationery',
      subtitle: 'Bestsellers & More',
      image: 'https://picsum.photos/seed/indianbooks/300/200',
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
      { id: 1, name: 'Banarasi Silk Saree', description: 'Pure silk with gold zari', price: 4500, imageUrl: 'https://picsum.photos/seed/saree/300/300', category: 'fashion' },
      { id: 2, name: 'Ethnic Kurta - Men', description: 'Cotton printed kurta', price: 899, imageUrl: 'https://picsum.photos/seed/kurta/300/300', category: 'fashion' },
      { id: 3, name: 'Garam Masala Premium 200g', description: 'Blend of 12 spices', price: 199, imageUrl: 'https://picsum.photos/seed/garammasala/300/300', category: 'home-kitchen' },
      { id: 4, name: 'Brass Diya Set', description: 'Traditional oil lamp set of 4', price: 650, imageUrl: 'https://picsum.photos/seed/brassdiya/300/300', category: 'home-kitchen' },
      { id: 5, name: 'Wireless Earbuds Pro', description: 'Active noise cancellation', price: 2999, imageUrl: 'https://picsum.photos/seed/earbudsindia/300/300', category: 'electronics' },
      { id: 6, name: 'Anarkali Suit - Women', description: 'Embroidered floor length', price: 2200, imageUrl: 'https://picsum.photos/seed/anarkali/300/300', category: 'fashion' },
      { id: 7, name: 'Cricket Bat - English Willow', description: 'Tournament grade', price: 3499, imageUrl: 'https://picsum.photos/seed/cricketbat/300/300', category: 'sports-fitness' },
      { id: 8, name: 'Organic Turmeric Powder 500g', description: 'Premium Lakadong turmeric', price: 349, imageUrl: 'https://picsum.photos/seed/turmeric/300/300', category: 'home-kitchen' },
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
