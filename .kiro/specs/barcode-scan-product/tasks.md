# Implementation Plan: Barcode Scan Product

## Overview

This implementation adds barcode scanning functionality to the admin product management page in the MyIndianStore unified-ui. The plan covers: BFF route additions, Angular service creation, barcode scanner component development (camera + hardware + manual input), product lookup/display, stock update, new product creation, and continuous scanning mode. All tasks use TypeScript for Angular frontend and JavaScript for the BFF server.

## Tasks

- [x] 1. Add BFF SKU lookup route and data models
  - [x] 1.1 Add `GET /api/items/sku/:sku` route to `server.js`
    - Add the SKU lookup route using `authenticateAdmin` middleware
    - Proxy to `${ITEM_SERVICE}/items/sku/${req.params.sku}`
    - Return product data on success, appropriate error status on failure
    - Place the route in the ITEMS section of server.js
    - _Requirements: 2.1, 2.2_

  - [x] 1.2 Create frontend TypeScript interfaces and models
    - Create `src/app/features/admin/models/barcode-scanner.models.ts`
    - Define `ProductLookupResult`, `ProductDetails`, `CreateProductRequest`, `StockUpdateRequest`, `ScannerState`, `CreateProductForm`, `ValidationResult` interfaces
    - Export from `src/app/features/admin/models/index.ts`
    - _Requirements: 2.3, 3.1, 4.1_

- [x] 2. Implement SkuLookupService
  - [x] 2.1 Create `sku-lookup.service.ts` in `src/app/features/admin/services/`
    - Implement `lookupBySku(sku: string): Observable<ProductLookupResult>` calling `GET /api/items/sku/:sku`
    - Implement `createProduct(product: CreateProductRequest): Observable<ProductDetails>` calling `POST /api/items`
    - Implement `updateStock(itemId: number, sku: string, quantity: number): Observable<void>` calling `POST /api/inventory`
    - Handle HTTP error responses: map 404 to `{ found: false }`, map 409 to duplicate SKU error, map network/server errors to error messages
    - Export from `src/app/features/admin/services/index.ts`
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 3.2, 4.3_

  - [ ]* 2.2 Write unit tests for SkuLookupService
    - Test successful SKU lookup returns `ProductLookupResult` with `found: true`
    - Test 404 response returns `{ found: false }`
    - Test network error returns error message
    - Test product creation call and 409 duplicate handling
    - Test stock update call
    - _Requirements: 2.2, 2.4, 2.5, 4.5_

- [x] 3. Implement BarcodeScannerComponent — structure and hardware scanner detection
  - [x] 3.1 Create BarcodeScannerComponent scaffold
    - Create directory `src/app/features/admin/components/barcode-scanner/`
    - Create `barcode-scanner.component.ts`, `.html`, `.scss`
    - Implement standalone component with `@Output() barcodeScanned`, `@Output() scannerError`, `@Input() isActive`
    - Implement `scannerState`, `cameraPermissionDenied`, `manualSkuValue` properties
    - Implement collapsible scanner panel layout with active indicator
    - _Requirements: 6.1, 6.2, 6.3, 5.4_

  - [x] 3.2 Implement hardware barcode scanner detection logic
    - Implement keypress event listener with timing heuristic (50ms threshold)
    - Buffer characters arriving faster than 50ms apart
    - Emit `barcodeScanned` when Enter is pressed and buffer length ≥ 3
    - Reset buffer when keypress interval exceeds threshold (manual typing)
    - Limit buffer to 128 characters
    - Add `@HostListener` for keyboard events
    - _Requirements: 1.3_

  - [ ]* 3.3 Write property test for hardware scanner barcode capture (Property 1)
    - **Property 1: Hardware scanner barcode capture correctness**
    - Generate random alphanumeric strings of length 3-50, simulate rapid keypress events (< 50ms), assert captured value equals input string
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 1.3**

  - [x] 3.4 Implement manual SKU entry
    - Add input field with submit button for manual barcode/SKU entry
    - On submit, emit `barcodeScanned` with the entered value
    - Clear input after submission
    - _Requirements: 1.5_

- [x] 4. Implement camera-based barcode scanning
  - [x] 4.1 Install and configure QuaggaJS 2
    - Add `@ericblade/quagga2` package dependency
    - Configure supported barcode formats: EAN-13, EAN-8, UPC-A, UPC-E, Code 128
    - _Requirements: 1.4_

  - [x] 4.2 Implement camera activation and barcode detection
    - Implement `activateCamera()` — request camera access via `navigator.mediaDevices.getUserMedia`, display live video preview, initialize QuaggaJS
    - Implement `deactivateCamera()` — stop video stream, stop QuaggaJS, release camera resources
    - On successful barcode detection, emit `barcodeScanned` with decoded value and provide visual/audio feedback
    - Handle camera permission denied: set `cameraPermissionDenied = true`, display fallback message
    - Handle no camera device: display appropriate message
    - Implement `ngOnDestroy` to release camera resources on navigation away
    - _Requirements: 1.1, 1.2, 1.6, 5.3, 5.5, 6.4_

- [x] 5. Checkpoint - Ensure scanner component builds cleanly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Integrate scanner into ProductManagementComponent with product lookup display
  - [x] 6.1 Add scanner panel integration to ProductManagementComponent
    - Add "Scan Barcode" toggle button in component header
    - Include `BarcodeScannerComponent` in template above the product table
    - Implement scanner activation/deactivation toggle
    - Ensure scanner panel is collapsible and doesn't disrupt existing table layout
    - Ensure existing product table remains fully functional while scanner is active
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

  - [x] 6.2 Implement product lookup result display
    - On `barcodeScanned` event, call `SkuLookupService.lookupBySku()`
    - Display product details (name, SKU, price, description, stock level) when product is found
    - Display "Product not found" message with "Create New Product" button when 404 returned
    - Display error message with "Retry" button on network/server errors
    - _Requirements: 2.3, 2.4, 2.5_

  - [ ]* 6.3 Write property test for product details display completeness (Property 2)
    - **Property 2: Product details display completeness**
    - Generate random valid product objects, render component, assert all field values present in output
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 2.3**

- [x] 7. Implement stock update and product creation forms
  - [x] 7.1 Implement inline stock update form
    - Display inline stock update form pre-filled with current stock level when product is found
    - Validate stock level is a non-negative integer before submission
    - Call `SkuLookupService.updateStock()` on form submit
    - Display success confirmation and update displayed stock level on success
    - Display error message and retain entered value on failure
    - Disable submit button and show loading indicator while request is in progress
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 7.2 Write property test for stock level input validation (Property 3)
    - **Property 3: Stock level input validation**
    - Generate arbitrary numbers (integers, decimals, negatives, zero), test validation function, assert passes iff non-negative integer
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 3.3**

  - [x] 7.3 Implement new product creation form
    - Display product creation form with scanned SKU pre-filled (non-editable) when user clicks "Create New Product"
    - Require name, price, and quantity fields
    - Validate: SKU non-empty, name non-empty, price ≥ 0, quantity is non-negative integer
    - Call `SkuLookupService.createProduct()` on form submit
    - Display success confirmation and show newly created product details on success
    - Handle 409 duplicate SKU: display message and offer to look up that SKU
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 7.4 Write property test for product creation form validation (Property 4)
    - **Property 4: Product creation form validation**
    - Generate arbitrary form data (mix of empty/non-empty strings, positive/negative/decimal numbers), test validation, assert passes iff all constraints satisfied
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 4.2, 4.6**

- [x] 8. Implement continuous scanning mode
  - [x] 8.1 Implement continuous scanning behavior
    - Keep scanner active and ready after product lookup or stock update completes
    - When a new barcode is scanned while previous result is displayed, initiate new lookup and replace previous result
    - Display visual indicator showing scanner is active and ready
    - Provide visual/audio feedback when barcode is successfully captured
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties defined in the design document
- Unit tests validate specific examples and edge cases
- The BFF already has `POST /api/items` (via admin-service) and `POST /api/inventory` routes — only `GET /api/items/sku/:sku` is new
- QuaggaJS 2 (`@ericblade/quagga2`) is the recommended library per design decision
- The project already includes `fast-check` v3.19.0 as a dev dependency

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "3.4", "4.1"] },
    { "id": 3, "tasks": ["3.3", "4.2"] },
    { "id": 4, "tasks": ["6.1"] },
    { "id": 5, "tasks": ["6.2", "8.1"] },
    { "id": 6, "tasks": ["6.3", "7.1", "7.3"] },
    { "id": 7, "tasks": ["7.2", "7.4"] }
  ]
}
```
