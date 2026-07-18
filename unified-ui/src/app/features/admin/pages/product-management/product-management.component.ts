import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { StatusBadgeComponent, StatusVariant } from '../../components/status-badge/status-badge.component';

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stockLevel: number;
  status: 'active' | 'inactive';
  thumbnail: string;
}

interface InventoryItem {
  sku: string;
  itemId: number;
  availableQuantity: number;
}

interface ProductEditForm {
  name: string;
  category: string;
  price: number | null;
  stockLevel: number | null;
}

interface KpiCard {
  label: string;
  value: number;
  icon: string;
}

/**
 * Admin Product Management page – Maacko-style redesign.
 * Displays KPI cards, search/filter bar, and a redesigned product data table
 * with status badges, action icons, and pagination.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 12.4
 */
@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.scss'],
})
export class ProductManagementComponent implements OnInit {
  private readonly itemsApiUrl = '/api/items';
  private readonly inventoryApiUrl = '/api/inventory';

  products: Product[] = [];
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  inventoryMap: Map<number, InventoryItem> = new Map();

  isLoading = true;
  hasError = false;
  errorMessage = '';

  // Search & Filters
  searchTerm = '';
  filterCategory = '';
  filterStatus = '';
  filterStock = '';
  categories: string[] = [];

  // Selection
  selectedProductIds: Set<number> = new Set();
  selectAll = false;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalProducts = 0;
  totalPages = 0;

  // Edit form
  editingProduct: Product | null = null;
  editForm: ProductEditForm = { name: '', category: '', price: null, stockLevel: null };
  isSubmitting = false;
  showSuccess = false;
  formError = '';
  validationErrors: { [key: string]: string } = {};

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  // ─── Navigation ──────────────────────────────────────────────────────────────

  goToAddProduct(): void {
    this.router.navigate(['/admin/products/add']);
  }

  // ─── KPI Cards ───────────────────────────────────────────────────────────────

  get kpiCards(): KpiCard[] {
    return [
      { label: 'All Products', value: this.allProducts.length, icon: '📦' },
      { label: 'Active', value: this.allProducts.filter(p => p.status === 'active').length, icon: '✅' },
      { label: 'Inactive', value: this.allProducts.filter(p => p.status === 'inactive').length, icon: '⏸️' },
      { label: 'Out of Stock', value: this.allProducts.filter(p => p.stockLevel <= 0).length, icon: '🚫' },
    ];
  }

  // ─── Data Loading ────────────────────────────────────────────────────────────

  loadProducts(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    this.http.get<any[]>(this.itemsApiUrl).subscribe({
      next: (items) => {
        this.http.get<any[]>(this.inventoryApiUrl).subscribe({
          next: (inventory) => {
            this.buildInventoryMap(inventory);
            this.allProducts = items.map((item) => this.mapToProduct(item));
            this.extractCategories();
            this.applyFilters();
            this.isLoading = false;
          },
          error: () => {
            this.allProducts = items.map((item) => this.mapToProduct(item));
            this.extractCategories();
            this.applyFilters();
            this.isLoading = false;
          },
        });
      },
      error: () => {
        this.hasError = true;
        this.errorMessage = 'Failed to load products. Please try again.';
        this.isLoading = false;
      },
    });
  }

  private buildInventoryMap(inventory: any[]): void {
    this.inventoryMap.clear();
    if (!inventory) return;
    for (const inv of inventory) {
      const itemId = inv.itemId || inv.item_id;
      if (itemId != null) {
        this.inventoryMap.set(itemId, {
          sku: inv.sku || '',
          itemId: itemId,
          availableQuantity: inv.availableQuantity ?? inv.available_quantity ?? 0,
        });
      }
    }
  }

  private mapToProduct(item: any): Product {
    const inv = this.inventoryMap.get(item.id);
    const stockLevel = inv ? inv.availableQuantity : 0;
    return {
      id: item.id,
      name: item.name || item.title || '',
      sku: inv?.sku || `SKU-${item.id}`,
      category: item.category || 'Uncategorized',
      price: item.price || 0,
      stockLevel: stockLevel,
      status: item.status === 'inactive' ? 'inactive' : 'active',
      thumbnail: item.imageUrl || item.image || 'assets/images/placeholder-product.png',
    };
  }

  private extractCategories(): void {
    const cats = new Set(this.allProducts.map(p => p.category));
    this.categories = Array.from(cats).sort();
  }

  // ─── Search & Filtering ──────────────────────────────────────────────────────

  applyFilters(): void {
    let filtered = [...this.allProducts];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        p => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)
      );
    }

    if (this.filterCategory) {
      filtered = filtered.filter(p => p.category === this.filterCategory);
    }

    if (this.filterStatus) {
      filtered = filtered.filter(p => p.status === this.filterStatus);
    }

    if (this.filterStock) {
      switch (this.filterStock) {
        case 'in-stock':
          filtered = filtered.filter(p => p.stockLevel >= 10);
          break;
        case 'low-stock':
          filtered = filtered.filter(p => p.stockLevel > 0 && p.stockLevel < 10);
          break;
        case 'out-of-stock':
          filtered = filtered.filter(p => p.stockLevel <= 0);
          break;
      }
    }

    this.filteredProducts = filtered;
    this.totalProducts = filtered.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalProducts / this.pageSize));
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    this.updatePagination();
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  // ─── Status Badge Helpers ────────────────────────────────────────────────────

  getStockVariant(stockLevel: number): StatusVariant {
    if (stockLevel <= 0) return 'out-of-stock';
    if (stockLevel < 10) return 'low-stock';
    return 'in-stock';
  }

  getStockText(stockLevel: number): string {
    if (stockLevel <= 0) return 'Out of Stock';
    if (stockLevel < 10) return 'Low Stock';
    return 'In Stock';
  }

  getStatusVariant(status: string): StatusVariant {
    return status === 'active' ? 'active' : 'inactive';
  }

  getStatusText(status: string): string {
    return status === 'active' ? 'Active' : 'Inactive';
  }

  // ─── Selection ───────────────────────────────────────────────────────────────

  toggleSelectAll(): void {
    if (this.selectAll) {
      this.products.forEach(p => this.selectedProductIds.add(p.id));
    } else {
      this.selectedProductIds.clear();
    }
  }

  toggleProductSelection(productId: number): void {
    if (this.selectedProductIds.has(productId)) {
      this.selectedProductIds.delete(productId);
    } else {
      this.selectedProductIds.add(productId);
    }
    this.selectAll = this.products.every(p => this.selectedProductIds.has(p.id));
  }

  isSelected(productId: number): boolean {
    return this.selectedProductIds.has(productId);
  }

  // ─── Pagination ──────────────────────────────────────────────────────────────

  updatePagination(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.products = this.filteredProducts.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // ─── Actions ─────────────────────────────────────────────────────────────────

  startEdit(product: Product): void {
    this.editingProduct = product;
    this.editForm = {
      name: product.name,
      category: product.category,
      price: product.price,
      stockLevel: product.stockLevel,
    };
    this.formError = '';
    this.validationErrors = {};
    this.showSuccess = false;
  }

  duplicateProduct(product: Product): void {
    console.log('Duplicate product:', product.id);
  }

  deleteProduct(product: Product): void {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      this.http.delete(`${this.itemsApiUrl}/${product.id}`).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: () => {
          alert('Failed to delete product. Please try again.');
        },
      });
    }
  }

  cancelEdit(): void {
    this.editingProduct = null;
    this.formError = '';
    this.validationErrors = {};
  }

  validateForm(): boolean {
    this.validationErrors = {};

    if (!this.editForm.name || this.editForm.name.trim().length === 0) {
      this.validationErrors['name'] = 'Product name is required';
    }

    if (!this.editForm.category || this.editForm.category.trim().length === 0) {
      this.validationErrors['category'] = 'Category is required';
    }

    if (this.editForm.price == null || this.editForm.price < 0) {
      this.validationErrors['price'] = 'Price must be a non-negative number';
    }

    if (this.editForm.stockLevel == null || this.editForm.stockLevel < 0 || !Number.isInteger(this.editForm.stockLevel)) {
      this.validationErrors['stockLevel'] = 'Stock level must be a non-negative whole number';
    }

    return Object.keys(this.validationErrors).length === 0;
  }

  submitEdit(): void {
    if (!this.editingProduct || !this.validateForm()) return;

    this.isSubmitting = true;
    this.formError = '';
    this.showSuccess = false;

    const itemPayload = JSON.stringify({
      id: this.editingProduct.id,
      name: this.editForm.name!.trim(),
      category: this.editForm.category!.trim(),
      price: this.editForm.price,
    });

    this.http.put(`${this.itemsApiUrl}/${this.editingProduct.id}`, itemPayload, {
      headers: { 'Content-Type': 'application/json' },
    }).subscribe({
      next: () => {
        if (this.editingProduct && this.editForm.stockLevel !== this.editingProduct.stockLevel) {
          this.updateInventory();
        } else {
          this.onEditSuccess();
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.formError = 'Failed to update product details. Please try again.';
      },
    });
  }

  private updateInventory(): void {
    if (!this.editingProduct) return;

    const inv = this.inventoryMap.get(this.editingProduct.id);
    const inventoryPayload = JSON.stringify({
      itemId: this.editingProduct.id,
      sku: inv?.sku || '',
      availableQuantity: this.editForm.stockLevel,
    });

    this.http.post(this.inventoryApiUrl, inventoryPayload, {
      headers: { 'Content-Type': 'application/json' },
    }).subscribe({
      next: () => {
        this.onEditSuccess();
      },
      error: () => {
        this.isSubmitting = false;
        this.formError = 'Product details updated but stock level update failed.';
      },
    });
  }

  private onEditSuccess(): void {
    this.isSubmitting = false;
    this.showSuccess = true;
    this.editingProduct = null;
    this.loadProducts();
  }

  // ─── Formatting ──────────────────────────────────────────────────────────────

  formatCurrency(amount: number): string {
    if (amount == null) return '₹0.00';
    return '₹' + amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  retry(): void {
    this.loadProducts();
  }
}
