import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { SellerPortalService, Seller, SellerProduct } from '../seller.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { productPlaceholder } from '../../../core/utils/product-image';

@Component({
  selector: 'app-seller-products',
  templateUrl: './seller-products.component.html',
  styleUrls: ['./seller-products.component.scss'],
})
export class SellerProductsComponent implements OnInit {
  seller: Seller | null = null;
  products: SellerProduct[] = [];
  isLoading = true;

  showForm = false;
  form: FormGroup;
  isSaving = false;
  formError: string | null = null;
  editingId: number | null = null;

  readonly categories = [
    'CLOTHING', 'GROCERY', 'HOME_DECOR', 'JEWELLERY',
    'ELECTRONICS', 'BOOKS', 'SPORTS', 'BEAUTY',
  ];

  constructor(
    private fb: FormBuilder,
    private portal: SellerPortalService,
    private notify: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      sku: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{3,40}$/)]],
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      price: [null, [Validators.required, Validators.min(1)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      itemType: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  /** Only approved sellers may publish; the API enforces this too. */
  get canPublish(): boolean {
    return this.seller?.status === 'APPROVED';
  }

  get statusLabel(): string {
    switch (this.seller?.status) {
      case 'APPROVED': return 'Approved — your listings are live';
      case 'PENDING_APPROVAL': return 'Awaiting approval';
      case 'REJECTED': return 'Application rejected';
      case 'SUSPENDED': return 'Account suspended';
      default: return '';
    }
  }

  get totalStock(): number {
    return this.products.reduce((sum, p) => sum + (p.quantity || 0), 0);
  }

  get stockValue(): number {
    return this.products.reduce((sum, p) => sum + (p.price || 0) * (p.quantity || 0), 0);
  }

  imageFor(p: SellerProduct): string {
    return productPlaceholder(p.name, p.id);
  }

  private load(): void {
    this.isLoading = true;
    this.portal.me().subscribe({
      next: (s) => { this.seller = s; },
      error: () => this.notify.show('Could not load your seller profile.', 'error'),
    });
    this.portal.products().subscribe({
      next: (p) => { this.products = p; this.isLoading = false; },
      error: () => { this.isLoading = false; this.notify.show('Could not load your products.', 'error'); },
    });
  }

  openForm(product?: SellerProduct): void {
    this.formError = null;
    this.editingId = product?.id ?? null;
    if (product) {
      this.form.patchValue({
        sku: product.sku, name: product.name, description: product.description || '',
        price: product.price, quantity: product.quantity, itemType: product.itemType || '',
      });
      // SKU identifies the listing downstream, so it is fixed once created.
      this.form.get('sku')?.disable();
    } else {
      this.form.reset({ sku: '', name: '', description: '', price: null, quantity: 0, itemType: '' });
      this.form.get('sku')?.enable();
    }
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.formError = null;
  }

  save(): void {
    this.formError = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError = 'Please correct the highlighted fields.';
      return;
    }
    this.isSaving = true;
    const payload = this.form.getRawValue();

    const done = {
      next: () => {
        this.isSaving = false;
        this.notify.show(this.editingId ? 'Product updated.' : 'Product listed.', 'success');
        this.closeForm();
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving = false;
        this.formError = err.error?.error || 'Could not save the product.';
      },
    };

    if (this.editingId) this.portal.updateProduct(this.editingId, payload).subscribe(done);
    else this.portal.addProduct(payload).subscribe(done);
  }

  remove(p: SellerProduct): void {
    this.portal.deleteProduct(p.id).subscribe({
      next: () => {
        this.products = this.products.filter((x) => x.id !== p.id);
        this.notify.show(`${p.name} removed from your catalogue.`, 'success');
      },
      error: (err: HttpErrorResponse) =>
        this.notify.show(err.error?.error || 'Could not remove that product.', 'error'),
    });
  }

  signOut(): void {
    this.authService.logout();
    this.router.navigate(['/seller/login']);
  }

  isBad(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && c.touched;
  }
}
