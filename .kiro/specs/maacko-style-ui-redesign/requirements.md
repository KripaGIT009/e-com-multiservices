# Requirements Document

## Introduction

This document specifies requirements for a complete UI redesign of the MyIndianStore Angular 18 e-commerce application to match the Maacko marketplace design style. The redesign covers authentication pages (Login, Registration), the admin dashboard, admin product management, add product form, active orders, closed orders, and order details pages. The existing storefront header is retained. The admin section transitions from a top-navigation layout to a persistent left sidebar navigation pattern with a clean, card-based content area.

## Glossary

- **Login_Page**: The authentication page where existing users enter credentials to access their account
- **Registration_Page**: The authentication page where new users create an account with verified contact information
- **Admin_Sidebar**: A persistent left-side vertical navigation panel displayed on all admin pages, containing icon-labeled menu items
- **Admin_Dashboard**: The main landing page of the admin section displaying KPI cards, quick actions, charts, and recent orders
- **Product_Management_Page**: The admin page for viewing, searching, filtering, and managing the product catalog
- **Add_Product_Page**: The admin form page for creating new products with details, pricing, images, and metadata
- **Active_Orders_Page**: The admin page listing orders that are in progress (pending, confirmed, shipped)
- **Closed_Orders_Page**: The admin page listing orders that are completed (delivered) or cancelled
- **Order_Details_Page**: The admin page showing full information for a single order including timeline, price breakdown, and delivery details
- **KPI_Card**: A summary metric card displaying a label, numeric value, and optional trend indicator
- **Status_Badge**: A colored label indicating the current state of an item (e.g., Active, Inactive, In Stock, Pending, Shipped)
- **Auth_Card**: A centered white card container used on authentication pages with form fields and action buttons
- **Design_System**: The shared SCSS variables, color tokens, and component styles defined in `_variables.scss`

## Requirements

### Requirement 1: Login Page Layout

**User Story:** As a returning user, I want a clean and modern login page with clear visual hierarchy, so that I can quickly sign in to my account.

#### Acceptance Criteria

1. THE Login_Page SHALL display a centered Auth_Card on a subtle gradient background.
2. THE Auth_Card SHALL display the MyIndianStore logo at the top of the card.
3. THE Auth_Card SHALL display a lock icon above the "Login to Your Account" heading.
4. WHEN the Login_Page is rendered, THE Login_Page SHALL display an email input field with a mail icon prefix and placeholder text.
5. WHEN the Login_Page is rendered, THE Login_Page SHALL display a password input field with a lock icon prefix and an eye icon toggle to show or hide the password.
6. THE Login_Page SHALL display a "Forgot Password?" link below the password field that navigates to the forgot-password route.
7. THE Login_Page SHALL display a filled primary-color "Login" button as the main form submission action.
8. THE Login_Page SHALL display an "or" text divider separating the Login button from the Cancel button.
9. THE Login_Page SHALL display an outlined "Cancel" button below the divider.
10. THE Login_Page SHALL display a "Don't have an account? Sign Up" link at the bottom of the card that navigates to the registration route.

### Requirement 2: Registration Page Layout

**User Story:** As a new user, I want a registration form with field verification steps, so that I can create a secure and verified account.

#### Acceptance Criteria

1. THE Registration_Page SHALL display a centered Auth_Card with the MyIndianStore logo at the top.
2. THE Registration_Page SHALL display a "Create Your Account" heading below the logo.
3. THE Registration_Page SHALL display a Name input field with appropriate label.
4. THE Registration_Page SHALL display an Email Address input field with a "Verify" button adjacent to the field.
5. WHEN the user clicks the Email Verify button, THE Registration_Page SHALL display an OTP input field with a countdown resend timer.
6. THE Registration_Page SHALL display a Phone Number input field with a "Verify" button adjacent to the field.
7. WHEN the user clicks the Phone Verify button, THE Registration_Page SHALL display an OTP input field for phone verification with a countdown resend timer.
8. THE Registration_Page SHALL display a Gender dropdown field with selectable options.
9. THE Registration_Page SHALL display a Password input field with an eye icon toggle to show or hide the password.
10. THE Registration_Page SHALL display a Re-enter Password input field for confirmation.
11. THE Registration_Page SHALL display a filled "Sign-up" button as the primary action.
12. THE Registration_Page SHALL display an outlined "Cancel" button.
13. THE Registration_Page SHALL display an "Already have an account? Login" link at the bottom navigating to the login route.

### Requirement 3: Admin Sidebar Navigation

**User Story:** As an admin user, I want a persistent sidebar with icon-labeled navigation items, so that I can navigate between admin pages without losing context.

#### Acceptance Criteria

1. WHILE a user is on any admin page, THE Admin_Sidebar SHALL remain visible on the left side of the viewport.
2. THE Admin_Sidebar SHALL display the following menu items with corresponding icons: Dashboard, Add Product, Manage Products, Active Orders, Closed Orders, Categories, Reviews, Earnings, Payouts, Store Settings, Profile, and Logout.
3. WHEN a menu item is selected, THE Admin_Sidebar SHALL highlight the active menu item with a distinct background color or accent indicator.
4. WHEN the Logout menu item is clicked, THE Admin_Sidebar SHALL invoke the logout action and redirect the user to the login page.
5. THE Admin_Sidebar SHALL be collapsible on smaller screen widths to preserve content area space.
6. THE Admin_Sidebar SHALL replace the existing top-navigation admin bar currently rendered in the header component.

### Requirement 4: Admin Dashboard Page

**User Story:** As an admin user, I want a dashboard with at-a-glance metrics and quick actions, so that I can monitor store performance and act on common tasks efficiently.

#### Acceptance Criteria

1. WHEN the Admin_Dashboard loads, THE Admin_Dashboard SHALL display a "Welcome back" greeting message with the admin user's name.
2. THE Admin_Dashboard SHALL display KPI_Cards for: Total Orders, Active Orders, Total Sales (in ₹), and Total Products.
3. THE Admin_Dashboard SHALL display quick action cards for: Add Product, Manage Products, Active Orders, Closed Orders, and Categories.
4. WHEN a quick action card is clicked, THE Admin_Dashboard SHALL navigate the user to the corresponding admin page.
5. THE Admin_Dashboard SHALL display an Order Overview line chart showing order trends over time.
6. THE Admin_Dashboard SHALL display a Recent Orders list showing the latest orders with order ID, customer name, amount, and status badge.

### Requirement 5: Product Management Page

**User Story:** As an admin user, I want to view and manage all products with filtering and search, so that I can maintain the product catalog efficiently.

#### Acceptance Criteria

1. THE Product_Management_Page SHALL display a "Manage Products" heading at the top of the content area.
2. THE Product_Management_Page SHALL display KPI_Cards for: All Products count, Active count, Inactive count, and Out of Stock count.
3. THE Product_Management_Page SHALL display a search bar for filtering products by name or SKU.
4. THE Product_Management_Page SHALL display filter dropdowns for Category, Status (Active/Inactive), and Stock level.
5. THE Product_Management_Page SHALL display a data table with columns: checkbox selector, Product (thumbnail image with name and price), SKU, Category, Price, Stock, Status, and Actions.
6. THE Product_Management_Page SHALL display Stock level as a Status_Badge with colors: green for "In Stock", amber for "Low Stock", and red for "Out of Stock".
7. THE Product_Management_Page SHALL display Status as a Status_Badge with colors: green for "Active" and gray for "Inactive".
8. THE Product_Management_Page SHALL display action icons for edit, duplicate, and delete operations on each product row.
9. THE Product_Management_Page SHALL display pagination controls below the table.

### Requirement 6: Add New Product Page

**User Story:** As an admin user, I want a comprehensive product creation form with organized sections, so that I can add complete product listings to the catalog.

#### Acceptance Criteria

1. THE Add_Product_Page SHALL display a breadcrumb navigation showing the path: Dashboard > Manage Products > Add New Product.
2. THE Add_Product_Page SHALL display a "Basic Information" section with fields: Product Name, SKU, Category dropdown, Sub Category, and Brand.
3. THE Add_Product_Page SHALL display a "Pricing & Stock" section with fields: Price, Compare at Price, Cost Price, Stock Quantity, Low Stock Alert threshold, and Stock Status radio buttons.
4. THE Add_Product_Page SHALL display a "Product Description" section with a Short Description textarea showing character count and a Full Description rich text editor.
5. THE Add_Product_Page SHALL display a "Product Images" section with a drag-and-drop upload area and preview thumbnails for uploaded images.
6. THE Add_Product_Page SHALL display an "Other Information" section with fields: Weight, Dimensions (Length, Width, Height), Tags input, and Product Status dropdown.
7. THE Add_Product_Page SHALL display three bottom action buttons: "Cancel" (navigates back), "Save as Draft", and "Publish Product".
8. WHEN the "Publish Product" button is clicked with valid form data, THE Add_Product_Page SHALL submit the product data to the backend and navigate to the product management page.
9. WHEN the "Save as Draft" button is clicked, THE Add_Product_Page SHALL save the product with a draft status without publishing it.

### Requirement 7: Active Orders Page

**User Story:** As an admin user, I want to view and manage in-progress orders with status filtering, so that I can track and update orders through their lifecycle.

#### Acceptance Criteria

1. THE Active_Orders_Page SHALL display KPI_Cards for: Total Active orders, Pending count, Confirmed count, and Shipped count.
2. THE Active_Orders_Page SHALL display a search bar for filtering orders by order ID or customer name.
3. THE Active_Orders_Page SHALL display filter controls for Date Range, Status, and Payment method.
4. THE Active_Orders_Page SHALL display an order table with columns: Order ID, Product (thumbnail image with name, SKU, and quantity), Customer (name and phone number), Amount (with payment method badge), Order Date, Status badge, and Actions.
5. WHEN the "View Details" action is clicked on an order row, THE Active_Orders_Page SHALL expand a details panel below the table showing Product Details, Delivery and Customer Details, and an Order Status update dropdown.
6. WHEN the admin selects a new status from the Order Status dropdown, THE Active_Orders_Page SHALL update the order status in the backend.

### Requirement 8: Closed Orders Page

**User Story:** As an admin user, I want to view completed and cancelled orders separately, so that I can review past order outcomes and revenue.

#### Acceptance Criteria

1. THE Closed_Orders_Page SHALL display KPI_Cards for: Total Closed orders, Total Revenue (in ₹), Delivered count, and Cancelled count.
2. THE Closed_Orders_Page SHALL display a "Delivered Orders" section with a data table listing delivered orders.
3. THE Closed_Orders_Page SHALL display a "Cancelled Orders" section with a separate data table listing cancelled orders.
4. THE Closed_Orders_Page SHALL display pagination controls for each table independently.
5. WHEN the "View Details" action is clicked on an order row, THE Closed_Orders_Page SHALL expand a details panel showing order information.

### Requirement 9: Order Details Page

**User Story:** As an admin user, I want a full-page order details view with complete order information and timeline, so that I can review all aspects of an order and update its status.

#### Acceptance Criteria

1. THE Order_Details_Page SHALL display a breadcrumb showing: Dashboard > Active Orders > Order #[ID].
2. THE Order_Details_Page SHALL display the Order ID and current Status_Badge in the page header.
3. THE Order_Details_Page SHALL display a "Back to Active Orders" navigation link.
4. THE Order_Details_Page SHALL display an "Update Order Status" dropdown for changing the order state.
5. THE Order_Details_Page SHALL display a Product Details section showing product image, name, SKU, category, brand, unit price, quantity, and total price.
6. THE Order_Details_Page SHALL display a Price Breakdown section showing Item Total, Shipping, Tax (GST 5%), Total Amount, Payment Method, and Payment Status.
7. THE Order_Details_Page SHALL display a Delivery and Customer Details section showing customer name, phone, email, delivery address, order ID, order date, expected delivery date, courier partner, and tracking ID with a "Track Order" link.
8. THE Order_Details_Page SHALL display an Order Timeline as a vertical stepper showing stages: Order Placed, Payment Confirmed, Processing, Shipped, Out for Delivery, and Delivered.
9. THE Order_Details_Page SHALL display an Order Items table with columns: Product, SKU, Price, Quantity, and Total, with a summary row showing subtotal, tax, shipping, and grand total.

### Requirement 10: Design System Updates

**User Story:** As a developer, I want consistent design tokens and reusable component styles for the redesigned pages, so that the UI remains visually coherent and maintainable.

#### Acceptance Criteria

1. THE Design_System SHALL extend `_variables.scss` with new tokens for sidebar width, sidebar background color, sidebar active-item color, card border radius, and admin content spacing.
2. THE Design_System SHALL define Status_Badge style variants for: Active (green), Inactive (gray), In Stock (green), Low Stock (amber), Out of Stock (red), Pending (blue), Confirmed (teal), Shipped (purple), Delivered (green), and Cancelled (red).
3. THE Design_System SHALL define Auth_Card styles including white background, rounded corners, box shadow, and consistent padding for use on both Login_Page and Registration_Page.
4. THE Design_System SHALL maintain backward compatibility with existing storefront styles by scoping admin redesign styles under the admin feature module.
5. THE Design_System SHALL use SCSS with BEM naming convention consistent with the existing codebase.

### Requirement 11: Responsive Layout

**User Story:** As a user on any device, I want the redesigned pages to adapt to different screen sizes, so that I can use the application comfortably on desktop, tablet, and mobile.

#### Acceptance Criteria

1. WHILE the viewport width is 1024px or greater, THE Admin_Sidebar SHALL display in expanded mode with icons and text labels.
2. WHILE the viewport width is between 768px and 1023px, THE Admin_Sidebar SHALL collapse to show only icons with tooltips on hover.
3. WHILE the viewport width is less than 768px, THE Admin_Sidebar SHALL be hidden by default and accessible via a hamburger menu toggle.
4. THE Auth_Card on Login_Page and Registration_Page SHALL scale to full width with horizontal padding on viewports below 480px.
5. THE data tables on Product_Management_Page, Active_Orders_Page, and Closed_Orders_Page SHALL support horizontal scrolling on viewports below 768px.

### Requirement 12: Accessibility Compliance

**User Story:** As a user with assistive technology, I want the redesigned pages to be keyboard navigable and screen-reader compatible, so that I can use all functionality without barriers.

#### Acceptance Criteria

1. THE Admin_Sidebar SHALL support keyboard navigation with arrow keys to move between menu items and Enter to activate them.
2. THE Auth_Card form fields SHALL have associated labels using `for` and `id` attributes and `aria-describedby` for error messages.
3. THE Status_Badge components SHALL include `aria-label` attributes describing the status for screen readers.
4. THE data tables SHALL use proper `<table>`, `<thead>`, `<tbody>`, `<th scope>` markup for accessibility.
5. THE Order Timeline stepper SHALL use `aria-current="step"` to indicate the current stage.
6. WHEN form validation errors occur, THE Login_Page and Registration_Page SHALL announce errors using `aria-live="polite"` regions.
