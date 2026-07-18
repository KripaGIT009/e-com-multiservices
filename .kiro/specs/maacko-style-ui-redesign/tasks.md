# Implementation Plan: Maacko-Style UI Redesign

## Overview

This plan transforms the MyIndianStore Angular 18 application's admin section and authentication pages to match the Maacko marketplace design style. Implementation proceeds from foundational design system tokens and shared components, through the admin layout shell, then individual page redesigns, finishing with responsiveness and accessibility passes.

## Tasks

- [x] 1. Design system tokens and shared styles
  - [x] 1.1 Extend `_variables.scss` with admin layout and auth card design tokens
    - Add CSS custom properties for sidebar dimensions, colors, top-bar height, content padding
    - Add auth card tokens (background, radius, shadow, padding, gradient colors)
    - Define status badge color map variables for all variants (active, inactive, in-stock, low-stock, out-of-stock, pending, confirmed, shipped, delivered, cancelled)
    - _Requirements: 10.1, 10.2, 10.3, 10.5_

  - [x] 1.2 Create `StatusBadgeComponent` as a reusable standalone component
    - Create component at `features/admin/components/status-badge/`
    - Implement variant-based CSS class mapping with BEM naming (`.status-badge--active`, etc.)
    - Include `aria-label` attribute for screen reader accessibility
    - Accept `text`, `variant`, and `label` inputs
    - _Requirements: 10.2, 12.3_

  - [x] 1.3 Create `BreadcrumbComponent` as a reusable standalone component
    - Create component at `features/admin/components/breadcrumb/`
    - Accept route-based path segments as input
    - Render clickable links for parent segments, plain text for current segment
    - _Requirements: 6.1, 9.1_

- [x] 2. Admin layout shell (sidebar + top bar)
  - [x] 2.1 Create `AdminLayoutComponent` with CSS Grid layout
    - Create standalone component at `features/admin/layout/`
    - Implement CSS Grid with template areas: topbar, sidebar, content
    - Include `<router-outlet>` for child page rendering
    - Manage sidebar collapsed state and pass to children
    - Inject `AuthService` for user context and logout handling
    - _Requirements: 3.1, 3.6_

  - [x] 2.2 Create `AdminTopBarComponent`
    - Create standalone component at `features/admin/layout/admin-top-bar/`
    - Display store logo/name, notification icon with badge, and profile dropdown
    - Emit `sidebarToggle` event for hamburger menu on mobile
    - Emit `logoutClicked` event from profile dropdown
    - _Requirements: 3.1, 4.1_

  - [x] 2.3 Create `AdminSidebarComponent` with menu items and navigation
    - Create standalone component at `features/admin/layout/admin-sidebar/`
    - Render all 12 menu items with Material icons and labels (Dashboard, Add Product, Manage Products, Active Orders, Closed Orders, Categories, Reviews, Earnings, Payouts, Store Settings, Profile, Logout)
    - Highlight active route item using `routerLinkActive`
    - Support collapsed state (icons only) via `@Input() collapsed`
    - Emit `logoutClicked` when Logout is clicked; handle redirect to login
    - Implement keyboard navigation with arrow keys and Enter key activation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 12.1_

  - [x] 2.4 Update `admin-routing.module.ts` to use `AdminLayoutComponent` as parent route
    - Wrap all admin child routes under `AdminLayoutComponent`
    - Add new routes for `orders/active`, `orders/closed`, `orders/:id`, `products/add`
    - Add redirect from `orders` to `orders/active`
    - Use lazy loading with `loadComponent` for new page components
    - _Requirements: 3.1, 3.6_

  - [x] 2.5 Update `AppComponent` to hide storefront header/footer on admin routes
    - Add `NavigationEnd` subscription to detect `/admin` routes
    - Conditionally render `<app-header>` and `<app-footer>` only on non-admin routes
    - _Requirements: 3.6_

  - [ ]* 2.6 Write unit tests for admin layout shell components
    - Test `AdminLayoutComponent` renders top-bar, sidebar, and outlet
    - Test `AdminSidebarComponent` renders menu items, emits events, toggles collapse
    - Test `AdminTopBarComponent` displays user name and emits events
    - Test `AppComponent` hides header/footer on admin routes
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Checkpoint - Verify admin layout shell
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Authentication pages redesign
  - [x] 4.1 Redesign `LoginComponent` template and styles
    - Replace existing template with Auth_Card centered layout on gradient background
    - Add MyIndianStore logo and lock icon above heading
    - Add email field with mail icon prefix and placeholder
    - Add password field with lock icon prefix and eye toggle for show/hide
    - Add "Forgot Password?" link navigating to forgot-password route
    - Add filled primary "Login" button, "or" divider, and outlined "Cancel" button
    - Add "Don't have an account? Sign Up" link at bottom
    - Apply auth-card BEM styles and use design tokens
    - Ensure all fields have associated `<label>` elements with `for`/`id` and `aria-describedby` for errors
    - Add `aria-live="polite"` region for validation error announcements
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 12.2, 12.6_

  - [x] 4.2 Redesign `RegisterComponent` template and styles
    - Replace template with Auth_Card layout matching login page style
    - Add logo and "Create Your Account" heading
    - Add Name, Email (with Verify button), Phone (with Verify button) fields
    - Add OTP input fields that appear after verify button click with countdown timer
    - Add Gender dropdown, Password with eye toggle, Re-enter Password field
    - Add "Sign-up" filled button, "Cancel" outlined button
    - Add "Already have an account? Login" link at bottom
    - Ensure all fields have accessible labels and error announcements
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 12.2, 12.6_

  - [ ]* 4.3 Write unit tests for auth page components
    - Test `LoginComponent` renders all fields, icons, and links; validates form; calls AuthService on submit
    - Test `RegisterComponent` renders verify buttons; shows OTP fields on click; validates password match
    - _Requirements: 1.1–1.10, 2.1–2.13_

- [x] 5. Admin Dashboard page redesign
  - [x] 5.1 Redesign `AdminDashboardComponent` template and styles
    - Add "Welcome back, [name]" greeting at top
    - Restructure KPI cards row: Total Orders, Active Orders, Total Sales (₹), Total Products
    - Add Quick Action cards: Add Product, Manage Products, Active Orders, Closed Orders, Categories
    - Wire quick action card clicks to navigate to corresponding admin routes
    - Add Order Overview line chart section (reuse/modify existing `RevenueChartComponent`)
    - Add Recent Orders list with order ID, customer name, amount, and status badge
    - Apply Maacko-style card layout with consistent spacing and border radius
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 5.2 Write unit tests for dashboard component
    - Test greeting displays user name
    - Test KPI cards render correct data
    - Test quick actions navigate to correct routes
    - Test recent orders list renders with status badges
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 6. Product Management page redesign
  - [x] 6.1 Redesign `ProductManagementComponent` template and styles
    - Add "Manage Products" heading
    - Add KPI cards row: All Products, Active, Inactive, Out of Stock
    - Add search bar for filtering by name or SKU
    - Add filter dropdowns for Category, Status, Stock level
    - Redesign data table with columns: checkbox, Product (thumbnail + name + price), SKU, Category, Price, Stock, Status, Actions
    - Use `StatusBadgeComponent` for Stock level (green/amber/red) and Status (green/gray)
    - Add edit, duplicate, delete action icons per row
    - Add pagination controls below table
    - Use proper `<table>`, `<thead>`, `<tbody>`, `<th scope>` markup
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 12.4_

  - [ ]* 6.2 Write unit tests for product management component
    - Test KPI cards render counts
    - Test search filters product list
    - Test status badges display correct variants
    - Test action icons are present per row
    - _Requirements: 5.1–5.9_

- [x] 7. Add New Product page
  - [x] 7.1 Create `AddProductComponent` with multi-section form
    - Create standalone component at `features/admin/pages/add-product/`
    - Add breadcrumb: Dashboard > Manage Products > Add New Product
    - Implement "Basic Information" section: Product Name, SKU, Category dropdown, Sub Category, Brand
    - Implement "Pricing & Stock" section: Price, Compare at Price, Cost Price, Stock Quantity, Low Stock Alert, Stock Status radios
    - Implement "Product Description" section: Short Description textarea with character count, Full Description rich text editor
    - Implement "Product Images" section: drag-and-drop upload area, preview thumbnails
    - Implement "Other Information" section: Weight, Dimensions (L/W/H), Tags input, Product Status dropdown
    - Add three action buttons: Cancel (navigate back), Save as Draft, Publish Product
    - Wire Publish to submit form data to backend and navigate to product management page
    - Wire Save as Draft to save with draft status
    - Implement section-level form validation (required: name, SKU, category, price, stock quantity)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

  - [ ]* 7.2 Write unit tests for add product component
    - Test all form sections render
    - Test validation prevents submission with missing required fields
    - Test image upload accepts valid file types
    - Test Cancel navigates back
    - _Requirements: 6.1–6.9_

- [x] 8. Checkpoint - Verify product and dashboard pages
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Active Orders page
  - [x] 9.1 Create `ActiveOrdersComponent` with order table and expandable details
    - Create standalone component at `features/admin/pages/active-orders/`
    - Add KPI cards: Total Active, Pending, Confirmed, Shipped
    - Add search bar for filtering by order ID or customer name
    - Add filter controls: Date Range, Status, Payment method
    - Add order table with columns: Order ID, Product (thumbnail + name + SKU + qty), Customer (name + phone), Amount (with payment method badge), Order Date, Status badge, Actions
    - Implement expandable details panel below table on "View Details" click showing: Product Details, Delivery/Customer Details, Order Status update dropdown
    - Wire status dropdown change to update order status via backend API
    - Use `StatusBadgeComponent` for order statuses
    - Use proper accessible table markup with `<th scope>`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 12.4_

  - [ ]* 9.2 Write unit tests for active orders component
    - Test KPI cards render
    - Test table displays order data with status badges
    - Test expandable details panel toggles
    - Test status update calls backend
    - _Requirements: 7.1–7.6_

- [x] 10. Closed Orders page
  - [x] 10.1 Create `ClosedOrdersComponent` with dual tables
    - Create standalone component at `features/admin/pages/closed-orders/`
    - Add KPI cards: Total Closed, Total Revenue (₹), Delivered, Cancelled
    - Add "Delivered Orders" section with data table
    - Add "Cancelled Orders" section with separate data table
    - Add independent pagination controls for each table
    - Implement expandable details panel on "View Details" click
    - Use `StatusBadgeComponent` for delivered/cancelled statuses
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 10.2 Write unit tests for closed orders component
    - Test dual tables render separately
    - Test independent pagination works
    - Test KPI cards show correct data
    - _Requirements: 8.1–8.5_

- [x] 11. Order Details page
  - [x] 11.1 Create `OrderDetailsComponent` with full order view and timeline
    - Create standalone component at `features/admin/pages/order-details/`
    - Add breadcrumb: Dashboard > Active Orders > Order #[ID]
    - Display Order ID and Status badge in page header
    - Add "Back to Active Orders" navigation link
    - Add "Update Order Status" dropdown for status changes
    - Implement Product Details section: image, name, SKU, category, brand, unit price, quantity, total
    - Implement Price Breakdown section: Item Total, Shipping, Tax (GST 5%), Total Amount, Payment Method, Payment Status
    - Implement Delivery and Customer Details section: name, phone, email, address, order ID, order date, expected delivery, courier partner, tracking ID with "Track Order" link
    - Implement Order Timeline vertical stepper: Order Placed, Payment Confirmed, Processing, Shipped, Out for Delivery, Delivered
    - Use `aria-current="step"` on current timeline stage
    - Implement Order Items table with product rows and summary (subtotal, tax, shipping, grand total)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 12.5_

  - [ ]* 11.2 Write unit tests for order details component
    - Test breadcrumb renders with order ID
    - Test timeline stepper marks current step with `aria-current`
    - Test price breakdown calculates correctly
    - Test status update dropdown emits change
    - _Requirements: 9.1–9.9_

- [x] 12. Checkpoint - Verify order pages
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Responsive layout implementation
  - [x] 13.1 Add responsive breakpoints to admin sidebar and layout
    - At ≥1024px: sidebar expanded with icons and text labels
    - At 768–1023px: sidebar collapsed to icons only with tooltips on hover
    - At <768px: sidebar hidden, accessible via hamburger menu toggle in top bar
    - Add CSS media queries and transitions for smooth collapse behavior
    - _Requirements: 11.1, 11.2, 11.3, 3.5_

  - [x] 13.2 Add responsive styles to auth cards and data tables
    - Auth card scales to full width with horizontal padding on viewports below 480px
    - Data tables on Product Management, Active Orders, and Closed Orders support horizontal scrolling below 768px
    - Wrap with `.table-responsive` container with `overflow-x: auto`
    - _Requirements: 11.4, 11.5_

- [x] 14. Accessibility compliance pass
  - [x] 14.1 Add accessibility attributes across all redesigned components
    - Ensure admin sidebar supports keyboard navigation (arrow keys + Enter)
    - Verify all auth form fields have `for`/`id` label associations and `aria-describedby` for errors
    - Verify `StatusBadgeComponent` includes `aria-label` on all instances
    - Verify all data tables use `<table>`, `<thead>`, `<tbody>`, `<th scope>` semantic markup
    - Verify order timeline uses `aria-current="step"` on current stage
    - Verify login and registration pages use `aria-live="polite"` for error announcements
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [ ]* 14.2 Write unit tests for accessibility attributes
    - Test sidebar keyboard navigation emits correct events
    - Test form fields have associated labels
    - Test status badges have aria-labels
    - Test tables have proper th scope attributes
    - _Requirements: 12.1–12.6_

- [x] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- No property-based tests are included because this is a UI/layout redesign with no pure algorithmic logic
- Unit tests validate component rendering, event emissions, and accessibility attributes
- The design uses Angular 18 standalone components with TypeScript
- All new admin components use BEM naming convention in SCSS
- The existing storefront header/footer remains unchanged; admin layout is isolated

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "2.2", "2.3", "4.1", "4.2"] },
    { "id": 3, "tasks": ["2.4", "2.5", "4.3"] },
    { "id": 4, "tasks": ["2.6", "5.1", "6.1", "7.1"] },
    { "id": 5, "tasks": ["5.2", "6.2", "7.2"] },
    { "id": 6, "tasks": ["9.1", "10.1", "11.1"] },
    { "id": 7, "tasks": ["9.2", "10.2", "11.2"] },
    { "id": 8, "tasks": ["13.1", "13.2"] },
    { "id": 9, "tasks": ["14.1"] },
    { "id": 10, "tasks": ["14.2"] }
  ]
}
```
