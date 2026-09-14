/** States and union territories, spelt as courier rules and addresses store them. */
export const INDIAN_STATES_AND_UTS: readonly string[] = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Lakshadweep', 'Puducherry',
];

/** Categories the catalogue uses for `itemType`. */
export const ITEM_TYPES: readonly string[] = [
  'CLOTHING', 'GROCERY', 'HOME_DECOR', 'JEWELLERY',
  'ELECTRONICS', 'BOOKS', 'SPORTS', 'BEAUTY',
];

/** Comma-separated text → trimmed, non-empty parts. */
export function splitList(value: string | null | undefined): string[] {
  return (value || '').split(',').map((s) => s.trim()).filter((s) => s.length > 0);
}
