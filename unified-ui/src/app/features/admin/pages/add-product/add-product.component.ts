import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BreadcrumbComponent, BreadcrumbSegment } from '../../components/breadcrumb/breadcrumb.component';
import { BarcodeScannerComponent } from '../../components/barcode-scanner/barcode-scanner.component';

export interface ProductImage {
  file: File;
  url: string;
  isPrimary: boolean;
}

/**
 * AddProductComponent
 *
 * Multi-section product creation form page with:
 * - Breadcrumb navigation (Dashboard > Manage Products > Add New Product)
 * - Basic Information section
 * - Pricing & Stock section
 * - Product Description section
 * - Product Images section (drag-and-drop)
 * - Other Information section
 * - Action buttons: Cancel, Save as Draft, Publish Product
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9
 */
@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, BreadcrumbComponent, BarcodeScannerComponent],
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.scss'],
})
export class AddProductComponent implements OnInit {
  breadcrumbSegments: BreadcrumbSegment[] = [
    { label: 'Dashboard', routerLink: '/admin' },
    { label: 'Manage Products', routerLink: '/admin/products' },
    { label: 'Add New Product' },
  ];

  productForm!: FormGroup;
  images: ProductImage[] = [];
  tags: string[] = [];
  tagInput = '';
  shortDescriptionMaxLength = 500;
  isDragOver = false;
  isSubmitting = false;
  submitError = '';

  categories = [
    'Electronics',
    'Clothing',
    'Home & Kitchen',
    'Books',
    'Health & Beauty',
    'Sports & Outdoors',
    'Toys & Games',
    'Food & Grocery',
    'Jewelry',
    'Automotive',
  ];

  // Barcode Scanner
  isScannerActive = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.productForm = this.fb.group({
      // Basic Information
      name: ['', [Validators.required, Validators.minLength(3)]],
      sku: ['', [Validators.required, Validators.minLength(2)]],
      category: ['', Validators.required],
      subCategory: [''],
      brand: [''],

      // Pricing & Stock
      price: [null, [Validators.required, Validators.min(0)]],
      compareAtPrice: [null, [Validators.min(0)]],
      costPrice: [null, [Validators.min(0)]],
      stockQuantity: [null, [Validators.required, Validators.min(0)]],
      lowStockAlert: [10, [Validators.min(0)]],
      stockStatus: ['in-stock'],

      // Product Description
      shortDescription: ['', [Validators.maxLength(500)]],
      fullDescription: [''],

      // Other Information
      weight: [null, [Validators.min(0)]],
      dimensionLength: [null, [Validators.min(0)]],
      dimensionWidth: [null, [Validators.min(0)]],
      dimensionHeight: [null, [Validators.min(0)]],
      productStatus: ['active'],
    });
  }

  // ─── Getters for template access ────────────────────────────────────────────

  get shortDescriptionLength(): number {
    return (this.productForm.get('shortDescription')?.value || '').length;
  }

  get shortDescriptionRemaining(): number {
    return this.shortDescriptionMaxLength - this.shortDescriptionLength;
  }

  // ─── Image Upload ───────────────────────────────────────────────────────────

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files) {
      this.processFiles(files);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processFiles(input.files);
      input.value = '';
    }
  }

  private processFiles(files: FileList): void {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    Array.from(files).forEach((file) => {
      if (!allowedTypes.includes(file.type)) return;
      if (file.size > maxSize) return;

      const reader = new FileReader();
      reader.onload = () => {
        this.images.push({
          file,
          url: reader.result as string,
          isPrimary: this.images.length === 0,
        });
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    const wasPrimary = this.images[index].isPrimary;
    this.images.splice(index, 1);
    if (wasPrimary && this.images.length > 0) {
      this.images[0].isPrimary = true;
    }
  }

  setPrimaryImage(index: number): void {
    this.images.forEach((img, i) => {
      img.isPrimary = i === index;
    });
  }

  // ─── Tags ───────────────────────────────────────────────────────────────────

  addTag(): void {
    const tag = this.tagInput.trim();
    if (tag && !this.tags.includes(tag)) {
      this.tags.push(tag);
    }
    this.tagInput = '';
  }

  onTagKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTag();
    }
  }

  removeTag(index: number): void {
    this.tags.splice(index, 1);
  }

  // ─── Barcode Scanner ─────────────────────────────────────────────────────────

  toggleScanner(): void {
    this.isScannerActive = !this.isScannerActive;
  }

  onBarcodeScanned(barcode: string): void {
    this.productForm.patchValue({ sku: barcode });
    this.isScannerActive = false;
  }

  onScannerError(error: string): void {
    console.warn('Scanner error:', error);
  }

  // ─── Form Submission ────────────────────────────────────────────────────────

  onCancel(): void {
    this.router.navigate(['/admin/products']);
  }

  onSaveAsDraft(): void {
    this.submitProduct('draft');
  }

  onPublish(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    this.submitProduct('active');
  }

  private submitProduct(status: 'active' | 'draft'): void {
    this.isSubmitting = true;
    this.submitError = '';

    const formValue = this.productForm.value;
    const payload = {
      sku: formValue.sku,
      name: formValue.name,
      description: formValue.shortDescription || formValue.fullDescription || '',
      price: formValue.price || 0,
      quantity: formValue.stockQuantity || 0,
      category: formValue.category,
      subCategory: formValue.subCategory,
      brand: formValue.brand,
      compareAtPrice: formValue.compareAtPrice,
      costPrice: formValue.costPrice,
      lowStockAlert: formValue.lowStockAlert,
      stockStatus: formValue.stockStatus,
      fullDescription: formValue.fullDescription,
      weight: formValue.weight,
      dimensions: {
        length: formValue.dimensionLength,
        width: formValue.dimensionWidth,
        height: formValue.dimensionHeight,
      },
      tags: this.tags,
      status,
    };

    this.http.post('/api/items', payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/admin/products']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.submitError =
          err.status === 409
            ? 'A product with this SKU already exists.'
            : 'Failed to save product. Please try again.';
      },
    });
  }

  // ─── Validation Helpers ─────────────────────────────────────────────────────

  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.productForm.get(fieldName);
    if (!field || !field.errors) return '';
    if (field.errors['required']) return 'This field is required';
    if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;
    if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters`;
    if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} characters`;
    return 'Invalid value';
  }
}
