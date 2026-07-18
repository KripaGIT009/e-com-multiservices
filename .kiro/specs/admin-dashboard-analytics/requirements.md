# Requirements Document

## Introduction

This feature enhances the MyIndianStore admin dashboard with comprehensive analytics capabilities. The current admin dashboard (AdminDashboardComponent) only displays placeholder statistics cards with no real data aggregation, charts, or actionable insights. This spec defines a full analytics dashboard backed by a new aggregation API in the admin-service that pulls data from order-service, payment-service, inventory-service, user-service, and item-service. The frontend will be enhanced with KPI cards, time-series charts, distribution visualizations, and management sub-pages for orders, users, products, and returns.

## Glossary

- **Admin_Service**: The backend microservice running on port 8011 responsible for admin authentication, management proxy operations, and audit logging
- **Dashboard_API**: A new REST endpoint in the Admin_Service that aggregates analytics data from multiple downstream services
- **Analytics_Dashboard**: The enhanced Angular component at `/admin` that displays KPI cards, charts, tables, and activity feeds
- **KPI_Card**: A summary card displaying a key performance indicator value with optional trend indicator
- **Order_Service**: The microservice on port 8001 providing order data and revenue information
- **Payment_Service**: The microservice on port 8002 providing payment transaction statistics
- **Inventory_Service**: The microservice on port 8003 providing stock level data
- **User_Service**: The microservice on port 8004 providing user account data
- **Item_Service**: The microservice on port 8005 providing product catalog data
- **Audit_Log**: The existing audit logging system in Admin_Service that records admin actions
- **Low_Stock_Alert**: A notification indicator for inventory items where available quantity falls below a configurable threshold
- **BFF**: The Backend-For-Frontend server (unified-ui/server.js) that proxies admin API requests with authentication middleware
- **Management_Controller**: The existing controller in Admin_Service that proxies CRUD operations to downstream services

## Requirements

### Requirement 1: Dashboard Analytics Aggregation API

**User Story:** As an admin user, I want to view aggregated analytics from all platform services in a single dashboard endpoint, so that I can monitor business performance without navigating multiple systems.

#### Acceptance Criteria

1. WHEN an authenticated admin requests the dashboard analytics endpoint, THE Dashboard_API SHALL return a JSON response containing totalOrders, totalRevenue, todayOrders, and pendingOrders aggregated from the Order_Service
2. WHEN an authenticated admin requests the dashboard analytics endpoint, THE Dashboard_API SHALL return totalUsers and newUsersThisWeek aggregated from the User_Service
3. WHEN an authenticated admin requests the dashboard analytics endpoint, THE Dashboard_API SHALL return totalProducts and lowStockCount aggregated from the Item_Service and Inventory_Service
4. WHEN an authenticated admin requests the dashboard analytics endpoint, THE Dashboard_API SHALL return paymentSuccessRate and totalRefunds aggregated from the Payment_Service
5. IF a downstream service is unreachable, THEN THE Dashboard_API SHALL return partial data with default values for the unavailable service and include a warnings array indicating which services failed
6. THE Dashboard_API SHALL respond within 5 seconds when all downstream services are healthy

### Requirement 2: Revenue Time-Series Data API

**User Story:** As an admin user, I want to view revenue trends over time, so that I can identify growth patterns and seasonal trends.

#### Acceptance Criteria

1. WHEN an authenticated admin requests revenue time-series data with a period parameter of "daily", THE Dashboard_API SHALL return daily revenue totals for the last 30 days
2. WHEN an authenticated admin requests revenue time-series data with a period parameter of "weekly", THE Dashboard_API SHALL return weekly revenue totals for the last 12 weeks
3. WHEN an authenticated admin requests revenue time-series data with a period parameter of "monthly", THE Dashboard_API SHALL return monthly revenue totals for the last 12 months
4. THE Dashboard_API SHALL return each time-series entry as an object containing a date label and a revenue amount value

### Requirement 3: Order Status Distribution API

**User Story:** As an admin user, I want to see the distribution of orders across statuses, so that I can identify bottlenecks in order fulfillment.

#### Acceptance Criteria

1. WHEN an authenticated admin requests order status distribution data, THE Dashboard_API SHALL return the count of orders grouped by status from the Order_Service
2. THE Dashboard_API SHALL return each status group as an object containing the status name and the order count for that status

### Requirement 4: Top Selling Products API

**User Story:** As an admin user, I want to see which products sell the most, so that I can make informed inventory and marketing decisions.

#### Acceptance Criteria

1. WHEN an authenticated admin requests top selling products, THE Dashboard_API SHALL return the top 10 products ranked by total quantity sold
2. THE Dashboard_API SHALL return each product entry with productName, productId, totalQuantitySold, and totalRevenue fields

### Requirement 5: Recent Activity Feed API

**User Story:** As an admin user, I want to see recent admin activity, so that I can monitor what actions other admins are performing.

#### Acceptance Criteria

1. WHEN an authenticated admin requests the activity feed, THE Dashboard_API SHALL return the 20 most recent Audit_Log entries ordered by timestamp descending
2. THE Dashboard_API SHALL return each activity entry with adminUsername, action, entityType, entityId, details, and timestamp fields

### Requirement 6: KPI Summary Cards Display

**User Story:** As an admin user, I want to see key business metrics displayed prominently when I open the dashboard, so that I can quickly assess overall platform health.

#### Acceptance Criteria

1. WHEN the Analytics_Dashboard loads, THE Analytics_Dashboard SHALL display KPI_Card components for total revenue, total orders, total customers, and total products
2. THE Analytics_Dashboard SHALL display each KPI_Card with a formatted numeric value, a descriptive label, and a visual icon
3. WHILE the dashboard data is loading, THE Analytics_Dashboard SHALL display loading skeleton placeholders in place of KPI_Card values

### Requirement 7: Revenue Chart Visualization

**User Story:** As an admin user, I want to see revenue data visualized as a chart, so that I can quickly identify trends without reading raw numbers.

#### Acceptance Criteria

1. WHEN revenue time-series data loads successfully, THE Analytics_Dashboard SHALL render a line or bar chart displaying revenue over time
2. WHEN the admin selects a different time period (daily, weekly, monthly), THE Analytics_Dashboard SHALL reload chart data for the selected period
3. THE Analytics_Dashboard SHALL label the chart X-axis with date labels and the Y-axis with currency-formatted revenue values

### Requirement 8: Order Status Distribution Chart

**User Story:** As an admin user, I want to see order status distribution as a visual chart, so that I can identify fulfillment bottlenecks at a glance.

#### Acceptance Criteria

1. WHEN order status distribution data loads successfully, THE Analytics_Dashboard SHALL render a pie or donut chart showing order counts per status
2. THE Analytics_Dashboard SHALL display a legend mapping each chart segment to its status name and count

### Requirement 9: Top Products and Low Stock Display

**User Story:** As an admin user, I want to see top selling products and low stock alerts together, so that I can prioritize restocking decisions.

#### Acceptance Criteria

1. WHEN top selling products data loads successfully, THE Analytics_Dashboard SHALL render a table with columns for rank, product name, quantity sold, and revenue
2. WHEN inventory data indicates items with stock below the low stock threshold, THE Analytics_Dashboard SHALL display a Low_Stock_Alert section listing product name, current stock, and threshold
3. THE Analytics_Dashboard SHALL visually distinguish Low_Stock_Alert items with a warning color indicator

### Requirement 10: Recent Activity Feed Display

**User Story:** As an admin user, I want to see a live feed of recent admin actions on the dashboard, so that I can stay aware of platform changes.

#### Acceptance Criteria

1. WHEN activity feed data loads successfully, THE Analytics_Dashboard SHALL display a scrollable list of recent audit log entries showing admin username, action type, entity, and relative timestamp
2. THE Analytics_Dashboard SHALL limit the visible feed to 20 entries with the most recent entries appearing first

### Requirement 11: Admin Order Management Sub-Page

**User Story:** As an admin user, I want a dedicated page to manage orders, so that I can update order statuses and view order details efficiently.

#### Acceptance Criteria

1. WHEN an admin navigates to /admin/orders, THE Analytics_Dashboard SHALL display a paginated table of all orders showing order ID, customer, date, status, and total amount
2. WHEN an admin clicks an order row, THE Analytics_Dashboard SHALL display the order details including line items, shipping address, and payment status
3. WHEN an admin selects a new status for an order, THE Analytics_Dashboard SHALL call the Management_Controller status update endpoint and refresh the order row

### Requirement 12: Admin User Management Sub-Page

**User Story:** As an admin user, I want a dedicated page to manage platform users, so that I can view, create, edit, and deactivate user accounts.

#### Acceptance Criteria

1. WHEN an admin navigates to /admin/users, THE Analytics_Dashboard SHALL display a paginated table of all users showing user ID, name, email, registration date, and status
2. WHEN an admin clicks the edit action for a user, THE Analytics_Dashboard SHALL display an edit form pre-populated with the user data
3. WHEN an admin submits the edit form with valid data, THE Analytics_Dashboard SHALL call the Management_Controller user update endpoint and display a success confirmation

### Requirement 13: Admin Product and Inventory Management Sub-Page

**User Story:** As an admin user, I want a dedicated page to manage products and their inventory levels, so that I can maintain the product catalog and stock.

#### Acceptance Criteria

1. WHEN an admin navigates to /admin/products, THE Analytics_Dashboard SHALL display a paginated table of all products showing product ID, name, category, price, and stock level
2. WHEN an admin clicks the edit action for a product, THE Analytics_Dashboard SHALL display an edit form for product details and inventory quantity
3. WHEN an admin submits product changes with valid data, THE Analytics_Dashboard SHALL call the Management_Controller item and inventory update endpoints and display a success confirmation

### Requirement 14: Admin Return Management Sub-Page

**User Story:** As an admin user, I want a dedicated page to manage return requests, so that I can approve or reject returns efficiently.

#### Acceptance Criteria

1. WHEN an admin navigates to /admin/returns, THE Analytics_Dashboard SHALL display a table of return requests showing return ID, order ID, reason, status, and request date
2. WHEN an admin clicks the approve action for a return, THE Analytics_Dashboard SHALL call the Management_Controller return approve endpoint and update the return status in the table
3. WHEN an admin clicks the reject action for a return, THE Analytics_Dashboard SHALL call the Management_Controller return reject endpoint and update the return status in the table

### Requirement 15: Dashboard Navigation and Quick Actions

**User Story:** As an admin user, I want quick navigation to common management tasks from the dashboard, so that I can perform frequent actions without extra navigation steps.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display a quick actions section with navigation links to orders, users, products, returns, and audit log management pages
2. WHEN an admin clicks a quick action link, THE Analytics_Dashboard SHALL navigate to the corresponding admin sub-page
