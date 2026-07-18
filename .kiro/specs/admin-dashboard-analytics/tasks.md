# Implementation Plan: Admin Dashboard Analytics

## Overview

This implementation adds comprehensive analytics capabilities to the MyIndianStore admin dashboard. The backend work introduces a new `DashboardAnalyticsController` and `DashboardAnalyticsService` in the admin-service that aggregate data from downstream microservices via parallel WebClient calls. The frontend work enhances the Angular admin dashboard with KPI cards, charts, tables, activity feeds, and management sub-pages. Property-based tests using jqwik validate the correctness of aggregation logic.

## Tasks

- [x] 1. Create backend DTOs and configuration
  - [x] 1.1 Create analytics DTO classes in admin-service
    - Create `DashboardSummaryDTO`, `TimeSeriesEntryDTO`, `StatusCountDTO`, `TopProductDTO`, and `ActivityFeedEntryDTO` in `admin-service/src/main/java/com/example/dto/`
    - Use `@Data`, `@Builder`, and `@AllArgsConstructor` Lombok annotations as defined in the design
    - Include `warnings` list in `DashboardSummaryDTO`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.4, 3.2, 4.2, 5.2_

  - [x] 1.2 Add dashboard configuration properties to application.yml
    - Add `dashboard.low-stock-threshold`, `dashboard.activity-feed-limit`, `dashboard.top-products-limit`, `dashboard.downstream-timeout-ms` under the dashboard config section
    - Create a `DashboardProperties` configuration class with `@ConfigurationProperties(prefix = "dashboard")`
    - _Requirements: 1.6, 9.2_

- [x] 2. Implement DashboardAnalyticsService
  - [x] 2.1 Implement fetchDashboardSummary method
    - Create `DashboardAnalyticsService` in `admin-service/src/main/java/com/example/service/`
    - Implement parallel WebClient calls to order-service, user-service, item-service, inventory-service, and payment-service using `Mono.zip`
    - Apply `onErrorResume` per-service with default values (0 for counts, 0.0 for rates)
    - Add service name to warnings array when a fallback is triggered
    - Enforce overall timeout of 5 seconds via `Mono.timeout`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 2.2 Write property test for summary aggregation field preservation
    - **Property 1: Summary aggregation preserves downstream field values**
    - **Validates: Requirements 1.1, 1.2**
    - Use jqwik to generate arbitrary valid downstream response payloads and verify the aggregated DTO fields exactly match source values

  - [ ]* 2.3 Write property test for low stock count calculation
    - **Property 2: Low stock count equals items below threshold**
    - **Validates: Requirements 1.3**
    - Use jqwik to generate arbitrary inventory item sets with varying quantities and thresholds, verify lowStockCount equals count of items below threshold

  - [ ]* 2.4 Write property test for payment success rate calculation
    - **Property 3: Payment success rate calculation correctness**
    - **Validates: Requirements 1.4**
    - Use jqwik to generate arbitrary sets of successful/failed payments, verify paymentSuccessRate equals (successful/total)*100 rounded to 1 decimal

  - [ ]* 2.5 Write property test for graceful degradation
    - **Property 4: Graceful degradation returns partial data with warnings**
    - **Validates: Requirements 1.5**
    - Use jqwik to generate arbitrary subsets of failing services, verify default values for failed services, correct values for healthy services, and warnings array has one entry per failed service

  - [x] 2.6 Implement fetchRevenueTimeSeries method
    - Call order-service revenue endpoint with period parameter
    - Return 30 entries for "daily", 12 for "weekly", 12 for "monthly"
    - Validate period parameter and return 400 for invalid values
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 2.7 Write property test for time-series entry count per period
    - **Property 5: Time-series output has correct entry count per period**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
    - Use jqwik to generate arbitrary period values and order data, verify correct entry counts (30/12/12) with non-null labels and non-negative values

  - [x] 2.8 Implement fetchOrderStatusDistribution method
    - Call order-service for order counts grouped by status
    - Return list of StatusCountDTO objects
    - _Requirements: 3.1, 3.2_

  - [ ]* 2.9 Write property test for order status distribution sum invariant
    - **Property 6: Order status distribution sum equals total orders**
    - **Validates: Requirements 3.1, 3.2**
    - Use jqwik to generate arbitrary order lists with assigned statuses, verify sum of all count values equals total input orders

  - [x] 2.10 Implement fetchTopSellingProducts method
    - Call order-service for top products by quantity sold
    - Sort descending by totalQuantitySold and cap at 10 entries
    - _Requirements: 4.1, 4.2_

  - [ ]* 2.11 Write property test for top products sort and cap invariant
    - **Property 7: Top products are sorted descending by quantity and capped at 10**
    - **Validates: Requirements 4.1, 4.2**
    - Use jqwik to generate arbitrary product sales data, verify min(N,10) entries sorted in non-increasing order by totalQuantitySold

  - [x] 2.12 Implement fetchActivityFeed method
    - Query local `AuditLogRepository` for most recent entries ordered by timestamp descending
    - Limit to configurable `activity-feed-limit` (default 20) entries
    - Map AuditLog entities to ActivityFeedEntryDTO
    - _Requirements: 5.1, 5.2_

  - [ ]* 2.13 Write property test for activity feed ordering and field mapping
    - **Property 8: Activity feed is ordered by timestamp descending and limited to 20**
    - **Validates: Requirements 5.1, 5.2**
    - Use jqwik to generate arbitrary audit log entry sets, verify min(M,20) entries in non-increasing timestamp order with correct field mapping

- [x] 3. Implement DashboardAnalyticsController
  - [x] 3.1 Create DashboardAnalyticsController with all endpoints
    - Create `DashboardAnalyticsController` in `admin-service/src/main/java/com/example/controller/`
    - Implement `GET /api/admin/dashboard/summary` returning DashboardSummaryDTO
    - Implement `GET /api/admin/dashboard/revenue?period={daily|weekly|monthly}` returning List<TimeSeriesEntryDTO>
    - Implement `GET /api/admin/dashboard/orders/status-distribution` returning List<StatusCountDTO>
    - Implement `GET /api/admin/dashboard/products/top-selling` returning List<TopProductDTO>
    - Implement `GET /api/admin/dashboard/activity-feed` returning List<ActivityFeedEntryDTO>
    - Secure all endpoints with existing JWT authentication
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 3.1, 4.1, 5.1_

  - [x] 3.2 Add jqwik test dependency to admin-service pom.xml
    - Add `net.jqwik:jqwik:1.8.2` with `<scope>test</scope>` to admin-service pom.xml
    - _Requirements: Testing infrastructure_

- [x] 4. Checkpoint - Backend verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create Angular analytics service and shared models
  - [x] 5.1 Create frontend TypeScript interfaces for analytics data
    - Create `DashboardSummary`, `TimeSeriesEntry`, `StatusCount`, `TopProduct`, and `ActivityFeedEntry` interfaces in `unified-ui/src/app/features/admin/models/`
    - _Requirements: 1.1, 2.4, 3.2, 4.2, 5.2_

  - [x] 5.2 Create AdminAnalyticsService in Angular
    - Create `AdminAnalyticsService` in `unified-ui/src/app/features/admin/services/`
    - Implement `getDashboardSummary()`, `getRevenueTimeSeries(period)`, `getOrderStatusDistribution()`, `getTopSellingProducts()`, `getActivityFeed()` methods
    - Call `/api/admin/dashboard/*` endpoints through the BFF proxy
    - _Requirements: 6.1, 7.1, 8.1, 9.1, 10.1_

- [x] 6. Implement KPI Cards and Dashboard Layout
  - [x] 6.1 Create KpiCardsComponent
    - Create `KpiCardsComponent` in `unified-ui/src/app/features/admin/components/`
    - Display 4 KPI cards for total revenue, total orders, total customers, total products
    - Show formatted numeric values with descriptive labels and icons
    - Implement loading skeleton placeholders while data is fetching
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 6.2 Create QuickActionsComponent
    - Create `QuickActionsComponent` with navigation links to orders, users, products, returns, and audit log pages
    - Use Angular router links to navigate to sub-pages
    - _Requirements: 15.1, 15.2_

  - [x] 6.3 Refactor AdminDashboardComponent to orchestrate sub-components
    - Update the existing `AdminDashboardComponent` to integrate KpiCardsComponent, QuickActionsComponent, and placeholders for charts/tables
    - Wire AdminAnalyticsService data fetching into the parent component
    - _Requirements: 6.1, 15.1_

- [x] 7. Implement Charts and Data Visualizations
  - [x] 7.1 Create RevenueChartComponent
    - Create `RevenueChartComponent` with a line/bar chart for revenue time-series
    - Add period selector (daily/weekly/monthly) that reloads chart data on change
    - Label X-axis with date labels and Y-axis with currency-formatted values
    - Show "No data available" message when data is empty
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 7.2 Create OrderStatusChartComponent
    - Create `OrderStatusChartComponent` with a pie/donut chart for order status distribution
    - Display legend mapping chart segments to status names and counts
    - _Requirements: 8.1, 8.2_

  - [x] 7.3 Create TopProductsTableComponent
    - Create `TopProductsTableComponent` with a ranked table showing product name, quantity sold, and revenue
    - Display up to 10 products sorted by quantity sold
    - _Requirements: 9.1_

  - [x] 7.4 Create LowStockAlertsComponent
    - Create `LowStockAlertsComponent` displaying items below the low stock threshold
    - Show product name, current stock, and threshold
    - Use warning color indicator for alert items
    - _Requirements: 9.2, 9.3_

  - [x] 7.5 Create ActivityFeedComponent
    - Create `ActivityFeedComponent` with a scrollable list of recent audit log entries
    - Show admin username, action type, entity, and relative timestamp
    - Limit to 20 entries with most recent first
    - _Requirements: 10.1, 10.2_

  - [x] 7.6 Wire all visualization components into AdminDashboardComponent
    - Integrate RevenueChartComponent, OrderStatusChartComponent, TopProductsTableComponent, LowStockAlertsComponent, and ActivityFeedComponent into the dashboard layout
    - Handle loading, error, and empty states for each component
    - _Requirements: 6.1, 7.1, 8.1, 9.1, 10.1_

- [x] 8. Checkpoint - Dashboard visualization verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Admin Management Sub-Pages
  - [x] 9.1 Create OrderManagementComponent
    - Create `OrderManagementComponent` at route `/admin/orders`
    - Implement paginated order table showing order ID, customer, date, status, and total amount
    - Implement order detail view with line items, shipping address, and payment status
    - Implement status update action calling Management_Controller endpoint
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 9.2 Create UserManagementComponent
    - Create `UserManagementComponent` at route `/admin/users`
    - Implement paginated user table showing user ID, name, email, registration date, and status
    - Implement edit form pre-populated with user data
    - Submit changes via Management_Controller user update endpoint with success confirmation
    - _Requirements: 12.1, 12.2, 12.3_

  - [x] 9.3 Create ProductManagementComponent
    - Create `ProductManagementComponent` at route `/admin/products`
    - Implement paginated product table showing product ID, name, category, price, and stock level
    - Implement edit form for product details and inventory quantity
    - Submit changes via Management_Controller item and inventory update endpoints with success confirmation
    - _Requirements: 13.1, 13.2, 13.3_

  - [x] 9.4 Create ReturnManagementComponent
    - Create `ReturnManagementComponent` at route `/admin/returns`
    - Implement return request table showing return ID, order ID, reason, status, and request date
    - Implement approve and reject actions calling Management_Controller return endpoints
    - Update return status in table after action completes
    - _Requirements: 14.1, 14.2, 14.3_

  - [x] 9.5 Register admin sub-page routes in AdminRoutingModule
    - Add lazy-loaded child routes for `/admin/orders`, `/admin/users`, `/admin/products`, `/admin/returns`
    - Ensure routes are protected by existing admin auth guards
    - _Requirements: 15.1, 15.2_

- [x] 10. Final checkpoint - Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties defined in the design using jqwik
- Unit tests validate specific examples and edge cases
- The backend uses Java with Spring Boot and the frontend uses TypeScript with Angular
- All analytics endpoints are secured behind existing JWT authentication
- The BFF proxy in server.js already handles `/api/admin/*` routing to admin-service

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "5.1"] },
    { "id": 1, "tasks": ["2.1", "2.6", "2.8", "2.10", "2.12", "3.2", "5.2"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "2.7", "2.9", "2.11", "2.13", "3.1"] },
    { "id": 3, "tasks": ["6.1", "6.2", "6.3"] },
    { "id": 4, "tasks": ["7.1", "7.2", "7.3", "7.4", "7.5"] },
    { "id": 5, "tasks": ["7.6"] },
    { "id": 6, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5"] }
  ]
}
```
