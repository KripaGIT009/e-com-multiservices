/**
 * Barcode scanner data models for the Admin Product Management page.
 * Requirements: 2.3, 3.1, 4.1
 */

/** Result of a product lookup by SKU */
export interface ProductLookupResult {
  found: boolean;
  product?: ProductDetails;
  error?: string;
}

/** Product details returned from item-service */
export interface ProductDetails {
  id: number;
  sku: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  itemType?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Request payload for creating a new product */
export interface CreateProductRequest {
  sku: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
}

/** Request payload for updating stock level */
export interface StockUpdateRequest {
  itemId: number;
  sku: string;
  availableQuantity: number;
}

/** Scanner state tracking */
export interface ScannerState {
  isActive: boolean;
  mode: 'camera' | 'hardware' | 'manual' | 'idle';
  lastScannedValue: string | null;
  lastScanTime: Date | null;
}

/** Form model for new product creation */
export interface CreateProductForm {
  sku: string;
  name: string;
  description: string;
  price: number | null;
  quantity: number | null;
}

/** Validation result with field-level errors */
export interface ValidationResult {
  valid: boolean;
  errors: { [field: string]: string };
}
