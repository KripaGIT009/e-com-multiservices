/**
 * Shapes for dropship partners, listings and supplier orders.
 * Contract: docs/commerce-architecture.md §8.2, §9.4 and §10.3. Cost prices and partner
 * references only ever reach /api/admin/** responses.
 */
import { OrderLine, ShipmentView } from './fulfilment.models';

export type OnboardingStatus = 'NOT_STARTED' | 'IN_DISCUSSION' | 'SANDBOX' | 'LIVE' | 'PAUSED';

export const ONBOARDING_STATUSES: { value: OnboardingStatus; label: string }[] = [
  { value: 'NOT_STARTED', label: 'Not started' },
  { value: 'IN_DISCUSSION', label: 'In discussion' },
  { value: 'SANDBOX', label: 'Sandbox' },
  { value: 'LIVE', label: 'Live' },
  { value: 'PAUSED', label: 'Paused' },
];

export type SupplierOrderStatus =
  | 'CREATED'
  | 'AWAITING_MANUAL_PLACEMENT'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export const SUPPLIER_STATUS_LABELS: Record<SupplierOrderStatus, string> = {
  CREATED: 'Created',
  AWAITING_MANUAL_PLACEMENT: 'Needs placing',
  SUBMITTED: 'Submitted',
  ACCEPTED: 'Accepted',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

export interface DropshipPartner {
  id?: number;
  code: string;
  name: string;
  bestFor?: string | null;
  integrationPotential?: string | null;
  website?: string | null;
  integrationType: string;
  onboardingStatus: OnboardingStatus;
  shipsWithOwnLogistics?: boolean | null;
  warehousePincode?: string | null;
  contactEmail?: string | null;
  notes?: string | null;
  active: boolean;
}

/** GET /api/admin/dropship/listings — a listing joined to its catalogue item. */
export interface DropshipListing {
  id: number;
  itemId: number;
  partnerCode: string;
  partnerName?: string | null;
  partnerSku: string;
  costPrice: number;
  partnerStock?: number | null;
  active: boolean;
  /** Catalogue item fields. */
  sku?: string | null;
  name?: string | null;
  description?: string | null;
  price?: number | null;
  quantity?: number | null;
  itemType?: string | null;
  /** Computed by the BFF from price and cost. */
  margin?: number | null;
  marginPercent?: number | null;
}

export interface NewListingRequest {
  partnerCode: string;
  partnerSku: string;
  costPrice: number | null;
  sku: string;
  name: string;
  description: string;
  price: number | null;
  quantity: number | null;
  itemType: string;
}

export interface SupplierOrderLine {
  itemId?: number | null;
  productName: string;
  partnerSku: string;
  quantity: number;
  unitCost: number;
}

export interface SupplierOrder {
  id: number;
  orderId: number;
  orderNumber?: string | null;
  partnerCode: string;
  partnerName?: string | null;
  status: SupplierOrderStatus;
  partnerOrderRef?: string | null;
  trackingNumber?: string | null;
  carrierName?: string | null;
  trackingUrl?: string | null;
  costTotal?: number | null;
  failureReason?: string | null;
  lastNote?: string | null;
  shipToName?: string | null;
  shipToPhone?: string | null;
  shipToAddress?: string | null;
  shipToPincode?: string | null;
  lines: SupplierOrderLine[];
  /** Statuses an operator may set via PUT /status (never CREATED). */
  allowedNextStatuses: SupplierOrderStatus[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface SupplierStatusUpdate {
  status: SupplierOrderStatus;
  partnerOrderRef?: string | null;
  trackingNumber?: string | null;
  carrierName?: string | null;
  trackingUrl?: string | null;
  note?: string | null;
}

/** GET /api/admin/orders/:orderId/fulfilment */
export interface FulfilmentGroup {
  fulfilmentKey: string;
  model: 'FIRST_PARTY' | 'SELLER' | 'DROPSHIP';
  label: string;
  lines: OrderLine[];
  shipped: boolean;
  shipment?: ShipmentView | null;
  supplierOrder?: SupplierOrder | null;
}

export interface OrderFulfilmentView {
  orderId: number;
  orderStatus: string;
  allShipped: boolean;
  groups: FulfilmentGroup[];
}
