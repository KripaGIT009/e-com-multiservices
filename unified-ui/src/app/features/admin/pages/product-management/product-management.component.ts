import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BarcodeScannerComponent } from '../../components/barcode-scanner/barcode-scanner.component';
import { SkuLookupService } from '../../services/sku-lookup.service';
import { ProductLookupResult, ProductDetails, CreateProductForm } from '../../models/barcode-scanner.models';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stockLevel: number;
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

/**
 * Admin Product Management sub-page.
 * Displays a paginated product table with edit form for product details and stock management.
 * Requirements: 13.1, 13.2, 13.3
 */
@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, FormsModule, BarcodeScannerComponent],
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.scss'],
})
export class ProductManagementComponent implements OnInit {
  private readonly itemsApiUrl = '/api/items';
  private readonly inventoryApiUrl = '/api/inventory';

  products: Product[] = [];
  allProducts: Product[] = [];
  inventoryMap: Map<number, InventoryItem> = new Map();

  isLoading = true;
  hasError = false;
  errorMessage = '';

  // Barcode scanner
  isScannerActive = false;
  lookupResult: ProductLookupResult | null = null;
  isLookingUp = false;
  lastScannedBarcode = '';

  // Stock update form
  stockUpdateQuantity: number | null = null;
  isUpdatingStock = false;
  stockUpdateError = '';
  stockUpdateSuccess = false;

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

  // Product creation form
  showCreateForm = false;
  createForm: CreateProductForm = { sku: '', name: '', description: '', price: null, quantity: null };
  isCreatingProduct = false;
  createFormErrors: { [field: string]: string } = {};
  createSuccess = false;
  createdProduct: ProductDetails | null = null;
  createError = '';
  isDuplicateSku = false;

  constructor(private http: HttpClient, private skuLookupService: SkuLookupService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    // Load items and inventory in parallel
    this.http.get<any[]>(this.itemsApiUrl).subscribe({
      next: (items) => {
        this.http.get<any[]>(this.inventoryApiUrl).subscribe({
          next: (inventory) => {
            this.buildInventoryMap(inventory);
            this.allProducts = items.map((item) => this.mapToProduct(item));
            this.totalProducts = this.allProducts.length;
            this.totalPages = Math.max(1, Math.ceil(this.totalProducts / this.pageSize));
            this.updatePagination();
            this.isLoading = false;
          },
          error: () => {
            // Inventory load failed but items loaded - show products without stock
            this.allProducts = items.map((item) => this.mapToProduct(item));
            this.totalProducts = this.allProducts.length;
            this.totalPages = Math.max(1, Math.ceil(this.totalProducts / this.pageSize));
            this.updatePagination();
            this.isLoading = false;
          },
        });
      },
      error: (err) => {
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
    return {
      id: item.id,
      name: item.name || item.title || '',
      category: item.category || '',
      price: item.price || 0,
      stockLevel: inv ? inv.availableQuantity : 0,
    };
  }

  updatePagination(): void {
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    this.products = this.allProducts.slice(start, start + this.pageSize);
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

  // Edit functionality
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

    // Update item details first
    this.http.put(`${this.itemsApiUrl}/${this.editingProduct.id}`, itemPayload, {
      headers: { 'Content-Type': 'application/json' },
    }).subscribe({
      next: () => {
        // Then update inventory if stock level changed
        if (this.editingProduct && this.editForm.stockLevel !== this.editingProduct.stockLevel) {
          this.updateInventory();
        } else {
          this.onEditSuccess();
        }
      },
      error: (err) => {
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
      error: (err) => {
        // Item updated but inventory failed - still show partial success
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

  formatCurrency(amount: number): string {
    if (amount == null) return '₹0.00';
    return '₹' + amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  getStockClass(stockLevel: number): string {
    if (stockLevel <= 0) return 'stock--out';
    if (stockLevel < 10) return 'stock--low';
    return 'stock--ok';
  }

  retry(): void {
    this.loadProducts();
  }

  /** Toggle the barcode scanner panel on/off. Requirements: 6.1, 6.2, 6.3, 6.5 */
  toggleScanner(): void {
    this.isScannerActive = !this.isScannerActive;
  }

  /** Handle barcode scanned event from the scanner component */
  onBarcodeScanned(barcode: string): void {
    this.lastScannedBarcode = barcode;
    this.isLookingUp = true;
    this.lookupResult = null;
    this.stockUpdateSuccess = false;
    this.stockUpdateError = '';
    this.showCreateForm = false;
    this.createSuccess = false;
    this.createdProduct = null;
    this.createError = '';
    this.isDuplicateSku = false;

    this.skuLookupService.lookupBySku(barcode).subscribe({
      next: (result) => {
        this.lookupResult = result;
        this.isLookingUp = false;
        if (result.found && result.product) {
          this.initStockUpdate();
        }
      },
      error: () => {
        this.lookupResult = { found: false, error: 'Unexpected error during lookup. Please try again.' };
        this.isLookingUp = false;
      },
    });
  }

  /** Retry the last barcode lookup */
  retryLookup(): void {
    if (this.lastScannedBarcode) {
      this.onBarcodeScanned(this.lastScannedBarcode);
    }
  }

  /** Dismiss the lookup result panel */
  dismissLookupResult(): void {
    this.lookupResult = null;
    this.lastScannedBarcode = '';
  }

  /** Handle scanner error event */
  onScannerError(error: string): void {
    console.warn('Scanner error:', error);
  }

  /** Show the product creation form with scanned SKU pre-filled. Requirements: 4.1 */
  showCreateProductForm(): void {
    this.showCreateForm = true;
    this.createForm = {
      sku: this.lastScannedBarcode,
      name: '',
      description: '',
      price: null,
      quantity: null,
    };
    this.createFormErrors = {};
    this.createError = '';
    this.createSuccess = false;
    this.createdProduct = null;
    this.isDuplicateSku = false;
    this.lookupResult = null;
  }

  /** Cancel the product creation form */
  cancelCreate(): void {
    this.showCreateForm = false;
    this.createFormErrors = {};
    this.createError = '';
    this.isDuplicateSku = false;
  }

  /** Validate the product creation form. Requirements: 4.2, 4.6 */
  validateCreateForm(): boolean {
    this.createFormErrors = {};

    if (!this.createForm.sku || this.createForm.sku.trim().length === 0) {
      this.createFormErrors['sku'] = 'SKU is required';
    }

    if (!this.createForm.name || this.createForm.name.trim().length === 0) {
      this.createFormErrors['name'] = 'Product name is required';
    }

    if (this.createForm.price == null || this.createForm.price < 0) {
      this.createFormErrors['price'] = 'Price must be a non-negative number';
    }

    if (this.createForm.quantity == null || this.createForm.quantity < 0 || !Number.isInteger(this.createForm.quantity)) {
      this.createFormErrors['quantity'] = 'Quantity must be a non-negative whole number';
    }

    return Object.keys(this.createFormErrors).length === 0;
  }

  /** Submit the product creation form. Requirements: 4.3, 4.4, 4.5 */
  submitCreate(): void {
    if (!this.validateCreateForm()) return;

    this.isCreatingProduct = true;
    this.createError = '';
    this.isDuplicateSku = false;

    const request = {
      sku: this.createForm.sku.trim(),
      name: this.createForm.name.trim(),
      description: this.createForm.description.trim(),
      price: this.createForm.price!,
      quantity: this.createForm.quantity!,
    };

    this.skuLookupService.createProduct(request).subscribe({
      next: (product) => {
        this.isCreatingProduct = false;
        this.createSuccess = true;
        this.createdProduct = product;
        this.showCreateForm = false;
      },
      error: (err: Error) => {
        this.isCreatingProduct = false;
        if (err.message && err.message.includes('SKU already exists')) {
          this.isDuplicateSku = true;
          this.createError = 'A product with this SKU already exists.';
        } else {
          this.createError = err.message || 'Failed to create product. Please try again.';
        }
      },
    });
  }

  /** Look up the duplicate SKU. Requirements: 4.5 */
  lookupDuplicateSku(): void {
    this.showCreateForm = false;
    this.createError = '';
    this.isDuplicateSku = false;
    this.onBarcodeScanned(this.createForm.sku);
  }

  /** Dismiss the create success panel */
  dismissCreateSuccess(): void {
    this.createSuccess = false;
    this.createdProduct = null;
  }

  /** Initialize stock update form with current stock level. Requirements: 3.1 */
  initStockUpdate(): void {
    if (this.lookupResult?.product) {
      this.stockUpdateQuantity = this.lookupResult.product.quantity;
      this.stockUpdateError = '';
      this.stockUpdateSuccess = false;
    }
  }

  /** Validate that stock level is a non-negative integer. Requirements: 3.3 */
  validateStockLevel(): boolean {
    if (this.stockUpdateQuantity == null) {
      this.stockUpdateError = 'Stock level is required.';
      return false;
    }
    if (!Number.isInteger(this.stockUpdateQuantity) || this.stockUpdateQuantity < 0) {
      this.stockUpdateError = 'Stock level must be a non-negative whole number.';
      return false;
    }
    this.stockUpdateError = '';
    return true;
  }

  /** Submit stock update to the server. Requirements: 3.2, 3.4, 3.5, 3.6 */
  submitStockUpdate(): void {
    if (!this.validateStockLevel()) return;
    if (!this.lookupResult?.product) return;

    const product = this.lookupResult.product;
    this.isUpdatingStock = true;
    this.stockUpdateError = '';
    this.stockUpdateSuccess = false;

    this.skuLookupService.updateStock(product.id, product.sku, this.stockUpdateQuantity!).subscribe({
      next: () => {
        this.isUpdatingStock = false;
        this.stockUpdateSuccess = true;
        // Update displayed stock level to reflect the new value
        if (this.lookupResult?.product) {
          this.lookupResult.product.quantity = this.stockUpdateQuantity!;
        }
      },
      error: (err: Error) => {
        this.isUpdatingStock = false;
        this.stockUpdateError = err.message || 'Failed to update stock. Please try again.';
        // Retain entered value on failure — stockUpdateQuantity is preserved
      },
    });
  }
}
