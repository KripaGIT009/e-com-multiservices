# Requirements Document

## Introduction

This feature adds barcode scanning functionality to the admin product management page (`/admin/products`) in the MyIndianStore unified-ui. Admin users can scan product barcodes using a device camera or a hardware barcode scanner to quickly look up products by their SKU, update stock levels for existing products, or create new products when a scanned barcode is not found in the system. The feature integrates with the existing item-service (port 8005) which already supports SKU-based lookups via `GET /items/sku/{sku}`.

## Glossary

- **Barcode_Scanner_Component**: The Angular UI component embedded in the product management page that handles barcode input from a device camera or hardware scanner
- **Item_Service**: The backend microservice (port 8005) responsible for product CRUD operations, exposing endpoints at `/items`
- **SKU**: Stock Keeping Unit — a unique alphanumeric identifier assigned to each product, stored in the `sku` field of the Item entity
- **BFF_Server**: The Express.js Backend-For-Frontend server (server.js) that proxies API calls from the Angular frontend to backend microservices
- **Camera_Scanner**: A browser-based barcode reader that uses the device camera and a JavaScript barcode decoding library to read barcode values
- **Hardware_Scanner**: A physical USB or Bluetooth barcode scanner device that emits keyboard input events when scanning a barcode
- **Product_Management_Page**: The existing Angular admin page at `/admin/products` (ProductManagementComponent) that displays and manages products
- **Inventory_Service**: The backend microservice (port 8003) responsible for tracking available inventory quantities per item

## Requirements

### Requirement 1: Barcode Input Capture

**User Story:** As an admin user, I want to capture barcode values from either a camera or a hardware barcode scanner, so that I can quickly identify products without manually typing SKUs.

#### Acceptance Criteria

1. WHEN the admin user activates the camera scanner, THE Barcode_Scanner_Component SHALL request camera access and display a live video preview
2. WHEN the Camera_Scanner detects a valid barcode in the video feed, THE Barcode_Scanner_Component SHALL extract the barcode value and populate the SKU lookup field
3. WHEN a Hardware_Scanner emits a rapid sequence of keypress events followed by an Enter key, THE Barcode_Scanner_Component SHALL capture the scanned value and populate the SKU lookup field
4. THE Barcode_Scanner_Component SHALL support reading EAN-13, EAN-8, UPC-A, UPC-E, and Code 128 barcode formats
5. WHEN the admin user manually types a barcode value into the SKU lookup field and submits, THE Barcode_Scanner_Component SHALL accept the manually entered value for product lookup
6. IF the browser denies camera access permission, THEN THE Barcode_Scanner_Component SHALL display a message indicating camera access was denied and suggest using manual entry or a hardware scanner

### Requirement 2: Product Lookup by Barcode

**User Story:** As an admin user, I want to look up a product by its scanned barcode value, so that I can quickly access product details and inventory information.

#### Acceptance Criteria

1. WHEN a barcode value is captured, THE Barcode_Scanner_Component SHALL send a lookup request to the BFF_Server using the scanned value as the SKU parameter
2. WHEN the BFF_Server receives a SKU lookup request, THE BFF_Server SHALL forward the request to the Item_Service endpoint `GET /items/sku/{sku}`
3. WHEN the Item_Service returns a matching product, THE Product_Management_Page SHALL display the product details including name, SKU, price, description, and current stock level
4. WHEN the Item_Service returns a 404 response indicating no matching product, THE Barcode_Scanner_Component SHALL display a "Product not found" message and offer the option to create a new product with the scanned SKU pre-filled
5. IF the lookup request fails due to a network error or server error, THEN THE Barcode_Scanner_Component SHALL display an error message and allow the admin user to retry the lookup

### Requirement 3: Quick Stock Level Update

**User Story:** As an admin user, I want to quickly update stock levels for an existing product after scanning its barcode, so that I can efficiently manage inventory during stock-taking.

#### Acceptance Criteria

1. WHEN a product is found via barcode lookup, THE Product_Management_Page SHALL display an inline stock update form pre-filled with the current stock level
2. WHEN the admin user submits a new stock level value, THE Product_Management_Page SHALL send an update request to the BFF_Server with the new quantity
3. THE Product_Management_Page SHALL validate that the stock level value is a non-negative integer before submission
4. WHEN the stock update request succeeds, THE Product_Management_Page SHALL display a success confirmation and update the displayed stock level
5. IF the stock update request fails, THEN THE Product_Management_Page SHALL display an error message and retain the entered stock value for retry
6. WHILE the stock update request is in progress, THE Product_Management_Page SHALL disable the submit button and display a loading indicator

### Requirement 4: New Product Creation from Scan

**User Story:** As an admin user, I want to create a new product when a scanned barcode is not found in the system, so that I can quickly register new inventory items.

#### Acceptance Criteria

1. WHEN the admin user chooses to create a new product after a "Product not found" result, THE Product_Management_Page SHALL display a product creation form with the scanned SKU pre-filled in the SKU field
2. THE Product_Management_Page SHALL require the admin user to provide name, price, and quantity fields before submission
3. WHEN the admin user submits the new product form with valid data, THE BFF_Server SHALL forward the creation request to the Item_Service endpoint `POST /items`
4. WHEN the Item_Service successfully creates the product, THE Product_Management_Page SHALL display a success confirmation and show the newly created product details
5. IF the product creation fails due to a duplicate SKU, THEN THE Product_Management_Page SHALL display a message indicating the SKU already exists and offer to perform a lookup for that SKU
6. THE Product_Management_Page SHALL validate that the SKU field is non-empty, name is non-empty, price is a non-negative number, and quantity is a non-negative integer before submission

### Requirement 5: Continuous Scanning Mode

**User Story:** As an admin user, I want to scan multiple products in succession without restarting the scanner each time, so that I can perform bulk stock-taking efficiently.

#### Acceptance Criteria

1. WHEN a product lookup or stock update completes, THE Barcode_Scanner_Component SHALL remain active and ready to accept the next barcode scan
2. WHEN a new barcode is scanned while a previous product result is displayed, THE Barcode_Scanner_Component SHALL initiate a new lookup for the newly scanned barcode and replace the previous result
3. WHEN the admin user explicitly deactivates the scanner, THE Barcode_Scanner_Component SHALL release the camera resource and stop listening for hardware scanner input
4. THE Barcode_Scanner_Component SHALL display a visual indicator showing the scanner is active and ready to accept input
5. THE Barcode_Scanner_Component SHALL play a brief audio or visual feedback when a barcode is successfully captured

### Requirement 6: Scanner Integration in Product Management Page

**User Story:** As an admin user, I want the barcode scanner to be seamlessly integrated into the existing product management page, so that I can use scanning alongside other product management features.

#### Acceptance Criteria

1. THE Product_Management_Page SHALL display a "Scan Barcode" button that activates the Barcode_Scanner_Component
2. WHILE the Barcode_Scanner_Component is active, THE Product_Management_Page SHALL display the scanner panel above the product table without disrupting the existing table layout
3. THE Barcode_Scanner_Component SHALL be collapsible so the admin user can hide the scanner panel when not in use
4. WHEN the admin user navigates away from the Product_Management_Page, THE Barcode_Scanner_Component SHALL release all camera resources and stop scanning
5. THE Product_Management_Page SHALL remain fully functional for manual product browsing and editing while the scanner is active
