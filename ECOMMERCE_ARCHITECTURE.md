# MyIndianStore E-Commerce Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER (Browser)                            │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     Angular UI (Port 4201)                           │  │
│  │                       MyIndianStore                                   │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │                                                                       │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────────┐  │  │
│  │  │   Navbar        │  │  Product List   │  │  Cart/Checkout    │  │  │
│  │  │  (Badges)       │  │  (with ratings) │  │  (4-step wizard)  │  │  │
│  │  └─────────────────┘  └─────────────────┘  └────────────────────┘  │  │
│  │          │                    │                      │               │  │
│  │          ▼                    ▼                      ▼               │  │
│  │  ┌──────────────────────────────────────────────────────────┐      │  │
│  │  │        UI Components (Standalone)                       │      │  │
│  │  ├──────────────────────────────────────────────────────────┤      │  │
│  │  │ • ProductListComponent        • ReviewsComponent        │      │  │
│  │  │ • ProductDetailComponent      • CompareProductsComp.   │      │  │
│  │  │ • CartComponent               • OrderHistoryComponent  │      │  │
│  │  │ • CheckoutComponent           • NavbarComponent        │      │  │
│  │  └──────────────────────────────────────────────────────────┘      │  │
│  │          │                │                │              │         │  │
│  │          ▼                ▼                ▼              ▼         │  │
│  │  ┌──────────────────────────────────────────────────────────┐      │  │
│  │  │        Angular Services (HTTP Clients)                  │      │  │
│  │  ├──────────────────────────────────────────────────────────┤      │  │
│  │  │ • CartService         • DiscountService                │      │  │
│  │  │ • ItemService         • ReviewService                 │      │  │
│  │  │ • CompareService      • OrderHistoryService           │      │  │
│  │  └──────────────────────────────────────────────────────────┘      │  │
│  │          │                │                │              │         │  │
│  └──────────┼────────────────┼────────────────┼──────────────┼─────────┘  │
│             │                │                │              │            │
└─────────────┼────────────────┼────────────────┼──────────────┼────────────┘
              │                │                │              │
              │ HTTP/REST      │                │              │
              │                │                │              │
    ┌─────────┴────────┬───────┴────────┬───────┴──────┬───────┴──────┐
    │                  │                │              │              │
    ▼                  ▼                ▼              ▼              ▼
┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐
│   API       │  │   API        │  │   API        │  │    API     │
│  Gateway    │  │  Gateway     │  │  Gateway     │  │  Gateway   │
│             │  │              │  │              │  │            │
│ Port 8001   │  │  Port 8007   │  │  Port 8080   │  │ Port 6001  │
└─────────────┘  └──────────────┘  └──────────────┘  └────────────┘
      │                │                  │               │
      │                │                  │               │
┌─────▼──────────────────────────────────┬─────────────────────────────────┐
│                   MICROSERVICES LAYER                                    │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                  ORDER SERVICE (Port 8001)                       │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │                                                                  │   │
│  │  Controllers:                                                   │   │
│  │  ├─ DiscountController    (POST /discounts/apply,validate)    │   │
│  │  └─ OrderController       (GET/POST /orders, /orders/{id})    │   │
│  │                                                                  │   │
│  │  Services:                                                      │   │
│  │  ├─ DiscountService       (Validation, Calculation)            │   │
│  │  ├─ OrderService          (CRUD, Status Updates)               │   │
│  │  └─ CartService           (Item Management)                    │   │
│  │                                                                  │   │
│  │  Repositories:                                                  │   │
│  │  ├─ DiscountRepository                                          │   │
│  │  └─ OrderRepository                                            │   │
│  │                                                                  │   │
│  │  Entities:                                                      │   │
│  │  ├─ Discount (code, type, value, validFrom/Until, maxUses)    │   │
│  │  └─ Order (orderNumber, userId, items, status, total)         │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│         │                                                    │             │
│         ▼                                                    ▼             │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │              PostgreSQL: order_db                                │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │                                                                  │   │
│  │  Tables:                                                         │   │
│  │  ├─ discounts (code, discountType, discountValue, ...)         │   │
│  │  ├─ orders (orderNumber, userId, totalAmount, status, ...)    │   │
│  │  └─ order_items (itemId, quantity, price, subtotal, ...)      │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                  ITEM SERVICE (Port 8007)                        │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │                                                                  │   │
│  │  Controllers:                                                   │   │
│  │  ├─ ReviewController       (GET/POST /items/{id}/reviews)     │   │
│  │  ├─ CompareListController  (GET/POST/DELETE /compare/...)     │   │
│  │  └─ ItemController         (GET /items, /items/{id})          │   │
│  │                                                                  │   │
│  │  Services:                                                      │   │
│  │  ├─ ReviewService          (CRUD, Rating Aggregation)          │   │
│  │  ├─ CompareListService     (Add/Remove/Clear Comparisons)     │   │
│  │  └─ ItemService            (Product Management)                │   │
│  │                                                                  │   │
│  │  Repositories:                                                  │   │
│  │  ├─ ReviewRepository                                            │   │
│  │  ├─ CompareListRepository                                      │   │
│  │  └─ ItemRepository                                             │   │
│  │                                                                  │   │
│  │  Entities:                                                      │   │
│  │  ├─ Review (itemId, rating 1-5, comment, createdAt)           │   │
│  │  ├─ CompareList (userId, itemIds[max 4])                      │   │
│  │  └─ Item (name, price, description, stock, category)          │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│         │                                                    │             │
│         ▼                                                    ▼             │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │              PostgreSQL: item_db                                 │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │                                                                  │   │
│  │  Tables:                                                         │   │
│  │  ├─ product_reviews (itemId, rating, comment, createdAt, ...)  │   │
│  │  ├─ compare_lists (userId, createdAt, updatedAt)              │   │
│  │  ├─ compare_items (compareId, itemId)                         │   │
│  │  └─ items (name, price, description, stock, category, ...)    │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘


```

## Feature Integration Map

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          FEATURE FLOWS                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  DISCOUNT/COUPON FEATURE                                               │
│  ├─ User enters coupon code in Checkout (Step 1)                      │
│  ├─ Frontend: DiscountService calls POST /discounts/apply              │
│  ├─ Backend: DiscountController → DiscountService.applyDiscount()    │
│  │   ├─ Validate coupon code exists                                  │
│  │   ├─ Check if active & within date range                          │
│  │   ├─ Verify usage count < maxUses                                 │
│  │   ├─ Confirm meets minimum purchase amount                        │
│  │   ├─ Calculate discount (% or fixed amount)                       │
│  │   └─ Increment usedCount in Discount entity                       │
│  └─ Returns: DiscountResponse with finalAmount                        │
│                                                                          │
│  CUSTOMER REVIEWS FEATURE                                              │
│  ├─ User clicks "View All Reviews & Add Your Review"                 │
│  ├─ ProductReviewsComponent loads (POST /items/{id}/reviews)         │
│  ├─ Frontend: ReviewService calls review endpoints                    │
│  ├─ Backend: ReviewController → ReviewService                        │
│  │   ├─ addReview: Creates new Review entity                         │
│  │   ├─ getReviews: Returns all reviews ordered by date              │
│  │   └─ getAverageRating: Calculates average 1-5 rating             │
│  └─ Displays: Review list + average rating + submission form          │
│                                                                          │
│  PRODUCT COMPARISON FEATURE                                            │
│  ├─ User clicks "Compare" button on products (max 4)                  │
│  ├─ Frontend: CompareService stores itemIds in BehaviorSubject       │
│  ├─ User navigates to /compare route                                 │
│  ├─ CompareProductsComponent displays comparison table                │
│  ├─ Backend: CompareListController (optional, for persistence)       │
│  │   ├─ addToCompare: Adds itemId to user's compare list            │
│  │   ├─ removeFromCompare: Removes itemId                           │
│  │   └─ clearCompareList: Empties entire list                        │
│  └─ Shows: Side-by-side specs, prices, add to cart for each         │
│                                                                          │
│  IMPROVED CHECKOUT FEATURE                                            │
│  ├─ Step 1: Review Cart                                              │
│  │  ├─ Display items from CartService                                │
│  │  ├─ **COUPON APPLICATION** (calls DiscountService)              │
│  │  └─ Show: items, subtotal, discount, shipping, total             │
│  ├─ Step 2: Shipping Address                                        │
│  │  └─ Validate and collect: name, email, phone, address           │
│  ├─ Step 3: Payment Method                                          │
│  │  └─ Select and validate payment details                          │
│  └─ Step 4: Review & Place Order                                   │
│     ├─ Display order summary                                          │
│     ├─ Call POST /orders to create Order                             │
│     └─ Show confirmation                                              │
│                                                                          │
│  ORDER HISTORY FEATURE                                                │
│  ├─ User navigates to /orders (OrderHistoryComponent)                │
│  ├─ Frontend: OrderHistoryService calls GET /orders/user/{userId}   │
│  ├─ Backend: OrderController → OrderService.getUserOrders()          │
│  ├─ Display three tabs:                                              │
│  │  ├─ All Orders: Returns all user orders                          │
│  │  ├─ Active Orders: Filters status in [pending, confirmed, shipped]│
│  │  └─ Delivered: Filters status = delivered                        │
│  ├─ User can:                                                         │
│  │  ├─ View order details (items, address, tracking)                │
│  │  ├─ Cancel pending orders (PUT /orders/{id}/cancel)             │
│  │  └─ Track shipments (GET /orders/track/{trackingNumber})        │
│  └─ Shows: Order status, items, shipping, tracking info             │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

```

## Data Flow: Complete Order with Discount

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE ORDER FLOW WITH DISCOUNT                   │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────┐
│ Customer │
│ Browsing │
└────┬─────┘
     │
     │ 1. Adds items to cart
     ▼
┌──────────────────────────────┐
│ Cart Component               │
│ (CartService manages state)  │
│ Items: [{id:1, qty:2, ...}] │
└────┬─────────────────────────┘
     │
     │ 2. Clicks "Checkout"
     ▼
┌──────────────────────────────────┐
│ CheckoutComponent Step 1         │
│ Review Cart                      │
├──────────────────────────────────┤
│ Items: [item1, item2]            │
│ Subtotal: ₹5000                 │
└────┬─────────────────────────────┘
     │
     │ 3. Enters coupon "SAVE10"
     ▼
┌──────────────────────────────────┐
│ DiscountService.applyDiscount()  │
│ (Frontend)                       │
│ couponCode="SAVE10"              │
│ cartTotal=5000                   │
└────┬─────────────────────────────┘
     │
     │ HTTP POST /discounts/apply
     ▼
┌─────────────────────────────────────────┐
│ DiscountController (Port 8001)          │
│ POST /discounts/apply                   │
└────┬────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────┐
│ DiscountService.applyDiscount()                  │
├──────────────────────────────────────────────────┤
│ 1. Find discount by code "SAVE10"               │
│ 2. Check: isActive = true ✓                     │
│ 3. Check: now between validFrom/validUntil ✓    │
│ 4. Check: usedCount < maxUses ✓                 │
│ 5. Check: cartTotal >= minPurchaseAmount ✓      │
│ 6. Calculate: 5000 * 10% = 500 discount        │
│ 7. Increment: usedCount++                       │
│ 8. Save to database: usedCount updated          │
│ 9. Return: DiscountResponse {                   │
│    originalAmount: 5000,                        │
│    discountAmount: 500,                         │
│    finalAmount: 4500,                           │
│    discountType: "PERCENTAGE"                   │
│ }                                               │
└────┬─────────────────────────────────────────────┘
     │
     │ HTTP 200 OK with response
     ▼
┌──────────────────────────────────────────┐
│ Frontend shows:                          │
├──────────────────────────────────────────┤
│ ✓ Coupon applied successfully            │
│ Subtotal:        ₹5000                  │
│ Discount (-10%): -₹500  [GREEN]         │
│ Shipping:        ₹0 (free)              │
│ TOTAL:           ₹4500  [ORANGE]        │
└────┬───────────────────────────────────┘
     │
     │ 4. Continues checkout steps 2 & 3
     ▼
┌──────────────────────────────────────────┐
│ Step 4: Review & Place Order             │
│ Confirms:                                │
│ - Items                                  │
│ - Address                                │
│ - Payment method                         │
│ - Final price with discount              │
└────┬───────────────────────────────────┘
     │
     │ 5. Clicks "Place Order"
     ▼
┌──────────────────────────────────────────┐
│ OrderService.createOrder()               │
│ POST /orders                             │
├──────────────────────────────────────────┤
│ Creates Order entity:                    │
│ {                                        │
│   orderNumber: "ORD-ABC12345",          │
│   userId: 1,                             │
│   items: [{itemId, qty, price, ...}],   │
│   totalAmount: 4500,  // AFTER DISCOUNT │
│   status: "pending",                     │
│   shippingAddress: "...",                │
│   createdAt: now                         │
│ }                                        │
└────┬───────────────────────────────────┘
     │
     │ Saves to order_db
     ▼
┌──────────────────────────────────────────┐
│ Database: order_db                       │
├──────────────────────────────────────────┤
│ orders table:                            │
│ {                                        │
│   id: 1,                                 │
│   orderNumber: "ORD-ABC12345",          │
│   userId: 1,                             │
│   totalAmount: 4500,                     │
│   status: "pending",                     │
│   ...                                    │
│ }                                        │
│                                          │
│ order_items table:                       │
│ {id: 1, orderId: 1, itemId: 1, qty: 2, │
│  price: 2500, subtotal: 5000}           │
│                                          │
│ discounts table:                         │
│ {code: "SAVE10", ..., usedCount: 2, ...}│
└────┬───────────────────────────────────┘
     │
     │ Returns Order with ID
     ▼
┌──────────────────────────────────────────┐
│ Order Confirmation Screen                │
├──────────────────────────────────────────┤
│ ✓ Order placed successfully!             │
│ Order #: ORD-ABC12345                    │
│ Total: ₹4500 (includes ₹500 discount)    │
│                                          │
│ Next: User can view in Order History    │
│ Status will update: Pending → Confirmed │
│         → Shipped → Delivered            │
└──────────────────────────────────────────┘

```

## Component Communication

```
┌─────────────────────────────────────────────────────────┐
│            COMPONENT INTERACTION DIAGRAM               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │         app-myindianstore (Root)                │ │
│  │  - Manages routing                             │ │
│  │  - Injects shared services                     │ │
│  └──────────┬─────────────────────────────────────┘ │
│             │                                        │
│             ├─ RouterModule                         │
│             │                                        │
│    ┌────────┴──────────────────────────────┐        │
│    │                                        │        │
│    ▼                    ▼                   ▼        │
│  ┌──────────┐  ┌─────────────┐  ┌──────────────┐   │
│  │Navbar    │  │Routing      │  │Cart Component│   │
│  │Component │  │Module       │  │              │   │
│  │          │  │             │  ├──────────────┤   │
│  │- Badges  │  │- Products   │  │CartService   │   │
│  │- Menus   │  │- Checkout   │  │• Items$      │   │
│  │- Routing │  │- Orders     │  │• addToCart() │   │
│  └──────────┘  │- Reviews    │  │• removeItem()│   │
│                │- Compare    │  │• updateQty() │   │
│                └─────────────┘  └──────────────┘   │
│                      │                               │
│       ┌──────────────┼──────────────────┐           │
│       │              │                  │           │
│       ▼              ▼                  ▼           │
│   ┌─────────┐  ┌──────────┐  ┌──────────────┐      │
│   │Checkout │  │Reviews   │  │Compare       │      │
│   │Component│  │Component │  │Component     │      │
│   │         │  │          │  │              │      │
│   │- Step 1:    │• Form    │  │• Table       │      │
│   │  Review     │• List    │  │• Add to cart │      │
│   │  Cart       │• Rating  │  │• Remove item │      │
│   │  + COUPON ◄─┤  avg     │  │• Clear all   │      │
│   │             │          │  │              │      │
│   │- Step 2:    └──────────┘  └──────────────┘      │
│   │  Address                                        │
│   │                                                 │
│   │- Step 3:    ┌──────────┐  ┌──────────────┐     │
│   │  Payment    │Order     │  │Product       │     │
│   │             │History   │  │Detail        │     │
│   │- Step 4:    │Component │  │Component     │     │
│   │  Review &   │          │  │              │     │
│   │  Place      │• Tabs    │  │• Ratings avg │     │
│   │  Order      │• Expand  │  │• Reviews link│     │
│   │             │• Status  │  │• Compare btn │     │
│   │             │• Track   │  │              │     │
│   │             └──────────┘  └──────────────┘     │
│   └──────────────┬──────────────────────────────┘   │
│                  │                                   │
│                  ▼                                   │
│   ┌────────────────────────────────────────┐       │
│   │  SERVICE LAYER                        │       │
│   ├────────────────────────────────────────┤       │
│   │  CartService         ReviewService      │       │
│   │  DiscountService     CompareService    │       │
│   │  OrderHistoryService ItemService      │       │
│   └────────────┬───────────────────────────┘       │
│                │                                    │
│                │ HTTP Calls                        │
│                │                                    │
│                ▼                                    │
│   ┌────────────────────────────────────────┐       │
│   │  API GATEWAYS                         │       │
│   ├────────────────────────────────────────┤       │
│   │  :8001 (Order Service)                 │       │
│   │  :8007 (Item Service)                  │       │
│   │  :8080 (User Service)                  │       │
│   │  :6001 (Cart Service)                  │       │
│   └────────────────────────────────────────┘       │
│                                                     │
└─────────────────────────────────────────────────────┘

```

## Summary

This architecture provides:

✅ **Separation of Concerns** - Clear layers (UI → Service → API → Database)
✅ **Scalability** - Microservices can scale independently
✅ **Reusability** - Services shared across components
✅ **Testability** - Easy to mock services for testing
✅ **Maintainability** - Clear structure and responsibility
✅ **Performance** - Optimized HTTP calls and database queries
✅ **Real-time Updates** - RxJS observables for reactive updates
✅ **Type Safety** - Full TypeScript implementation

---

**Architecture Version**: 1.0.0
**Last Updated**: 2024-01-01
