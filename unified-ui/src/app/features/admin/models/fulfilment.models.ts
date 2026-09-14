/**
 * Shapes for couriers, courier allocation and own-product fulfilment.
 * Contract: docs/commerce-architecture.md §6, §9.3 and §10.3. Money arrives as JSON
 * numbers serialised from BigDecimal; it is displayed, never recalculated, here.
 */

export type FulfilmentModel = 'FIRST_PARTY' | 'SELLER' | 'DROPSHIP';
export type AllocationReason = 'MANUAL' | 'RULE' | 'DEFAULT' | 'STRATEGY' | 'NONE';
export type FallbackStrategy = 'FASTEST' | 'CHEAPEST' | 'PRIORITY';

export const FULFILMENT_MODEL_LABELS: Record<FulfilmentModel, string> = {
  FIRST_PARTY: 'Own products',
  SELLER: 'Marketplace sellers',
  DROPSHIP: 'Dropship (when the partner does not ship)',
};

export const STRATEGY_OPTIONS: { value: FallbackStrategy; label: string; help: string }[] = [
  { value: 'FASTEST', label: 'Fastest', help: 'Fewest transit days; the lower rate breaks a tie.' },
  { value: 'CHEAPEST', label: 'Cheapest', help: 'Lowest base rate; fewer transit days breaks a tie.' },
  { value: 'PRIORITY', label: 'Priority', help: 'Lowest priority number you set on the partner; transit days break a tie.' },
];

export const REASON_LABELS: Record<AllocationReason, string> = {
  MANUAL: 'Manual pick',
  RULE: 'Location rule',
  DEFAULT: 'Default courier',
  STRATEGY: 'Fallback strategy',
  NONE: 'No courier',
};

export interface DeliveryPartner {
  id: number;
  code: string;
  name: string;
  trackingUrlTemplate?: string | null;
  estimatedDays: number;
  baseRate: number;
  active: boolean;
  servicePincodePrefixes?: string | null;
  integrationType?: string | null;
  integrationConfigured?: boolean;
  integrationLabel?: string | null;
  aggregator?: boolean | null;
  priority?: number | null;
  codSupported?: boolean | null;
}

/** An adapter registered in logistics-service or supplier-service. */
export interface IntegrationInfo {
  key: string;
  label: string;
  configured: boolean;
  capabilities: string[];
  requiredEnvironment: string[];
}

export interface CourierRule {
  id: number;
  name: string;
  partnerCode: string;
  /** Comma-separated, e.g. "56,60,50". */
  pincodePrefixes?: string | null;
  /** Comma-separated state names. */
  states?: string | null;
  /** Null applies the rule to every model. */
  fulfilmentModel?: FulfilmentModel | null;
  priority: number;
  active: boolean;
}

export interface AllocationSettings {
  fulfilmentModel: FulfilmentModel;
  defaultPartnerCode?: string | null;
  fallbackStrategy: FallbackStrategy;
  allowManualOverride: boolean;
  updatedAt?: string | null;
}

export interface CourierOption {
  code: string;
  name: string;
  estimatedDays: number;
  baseRate: number;
  trackingUrlTemplate?: string | null;
  integrationType?: string | null;
}

export interface AllocationQuoteRequest {
  fulfilmentModel: FulfilmentModel;
  deliveryPincode: string;
  deliveryState: string | null;
  pickupPincode: string | null;
  cod: boolean;
  preferredPartnerCode: string | null;
}

export interface AllocationQuote {
  selected: CourierOption | null;
  reason: AllocationReason;
  ruleId?: number | null;
  ruleName?: string | null;
  explanation: string;
  manualOverrideRejected?: string | null;
  candidates: CourierOption[];
}

/** A shipment as returned by logistics-service, including the M1 booking fields. */
export interface ShipmentView {
  id?: number;
  shipmentNumber?: string;
  status?: string;
  carrier?: string | null;
  partnerCode?: string | null;
  trackingNumber?: string | null;
  carrierTrackingUrl?: string | null;
  estimatedDelivery?: string | null;
  fulfilmentKey?: string | null;
  bookingMode?: string | null;
  trackingGenerated?: boolean | null;
  labelUrl?: string | null;
  bookingNote?: string | null;
  alreadyBooked?: boolean | null;
  weightGramsUsed?: number | null;
  lastStatusNote?: string | null;
  createdAt?: string | null;
}

export interface ShippingAddress {
  fullName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  country?: string;
}

export interface OrderLine {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  sellerName?: string | null;
  fulfilmentPartnerCode?: string | null;
}

/** One entry of GET /api/admin/fulfilment. */
export interface FulfilmentQueueOrder {
  orderId: number;
  orderNumber: string;
  orderStatus: string;
  createdAt: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  shippingAddress?: ShippingAddress | null;
  shippingAddressLine?: string | null;
  lines: OrderLine[];
  shipment?: ShipmentView | null;
  suggestion?: AllocationQuote | null;
}

/** The address as one line, preferring the structured snapshot over the legacy line. */
export function addressText(addr?: ShippingAddress | null, line?: string | null): string {
  if (addr) {
    const parts = [addr.addressLine1, addr.addressLine2, addr.city, addr.state]
      .map((p) => (p || '').trim())
      .filter((p) => p.length > 0);
    const text = parts.join(', ') + (addr.postalCode ? ` - ${addr.postalCode}` : '');
    if (text.trim()) return text;
  }
  return (line || '').trim();
}

/** GET /api/orders/:id as an admin — order-service's OrderDTO. */
export interface AdminOrderView {
  id: number;
  orderNumber: string;
  customerId?: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt?: string | null;
  notes?: string | null;
  items: OrderLine[];
  shippingAddress?: ShippingAddress | null;
  shippingAddressLine?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  deliveryPartnerCode?: string | null;
  deliveryPartnerName?: string | null;
  deliveryAssignmentReason?: AllocationReason | null;
  expectedDelivery?: string | null;
}

/** A booking just made from the Fulfilment queue. */
export interface FulfilmentBooking {
  order: FulfilmentQueueOrder;
  shipment: ShipmentView;
}

export interface ShipRequest {
  partnerCode: string | null;
  trackingNumber: string | null;
}
