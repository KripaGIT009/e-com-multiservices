# Checkout Flow

## Today

Checkout is a sequence of BFF calls with **no compensation**. If a step fails after an
earlier one succeeded, the earlier effect stays.

```mermaid
sequenceDiagram
    participant UI as Checkout stepper
    participant BFF
    participant ORD as order-service
    participant RZP as Razorpay

    UI->>BFF: POST /api/orders {items, shippingAddress, totalAmount}
    Note over BFF,ORD: shippingAddress and totalAmount are dropped —<br/>CreateOrderRequest has neither field
    BFF->>ORD: POST /api/v1/orders {customerId, items}
    ORD-->>UI: 201 {id, orderNumber, status: PENDING}

    UI->>BFF: POST /api/payments/razorpay/create-order
    BFF->>RZP: create order (or demo mode)
    UI->>RZP: payment modal
    UI->>BFF: POST /api/payments/razorpay/verify
    BFF->>BFF: verify HMAC signature
    UI->>BFF: DELETE /api/cart/:id/clear
    UI->>UI: navigate to confirmation
```

### Known problems

1. **No inventory reservation.** Nothing decrements or holds stock. Two customers can
   buy the last unit.
2. **The shipping address is discarded** (`CODE_REVIEW.md` §2.3). Orders are
   undeliverable.
3. **No compensation.** If payment fails, the `PENDING` order stays forever.
4. **Payment does not update order status.** A paid order stays `PENDING`.
5. **No tax or shipping calculation.** The total is the sum of line prices.
6. **The client's `totalAmount` is ignored** — correct, order-service recomputes from
   line items — but nothing validates the two agree, so a price change between cart
   and checkout is silent.

## Target

A saga with explicit compensation, orchestrated by `checkout-service`.

```mermaid
sequenceDiagram
    participant UI
    participant BFF
    participant CHK as checkout-service
    participant PRICE as pricing
    participant INV as inventory
    participant TAX as tax
    participant ORD as order
    participant PAY as payment

    UI->>BFF: POST /api/v1/checkout {cartId, addressId, paymentMethod}
    BFF->>CHK: start (Idempotency-Key)

    CHK->>PRICE: revalidate every line
    alt price changed
        CHK-->>UI: 409 PRICE_CHANGED (show the new price)
    end

    CHK->>INV: reserve(items, reservationId)
    alt insufficient stock
        CHK-->>UI: 409 OUT_OF_STOCK
    end

    CHK->>TAX: calculate(items, address)
    CHK->>ORD: create order (snapshots: price, name, address, tax)
    ORD-->>CHK: orderId, PAYMENT_PENDING

    CHK->>PAY: authorise(orderId, amount, Idempotency-Key)
    alt payment failed
        CHK->>INV: release(reservationId)
        CHK->>ORD: cancel(orderId, PAYMENT_FAILED)
        CHK-->>UI: 402 PAYMENT_FAILED
    end

    CHK->>INV: allocate(reservationId)
    CHK->>ORD: confirm(orderId)
    ORD--)PAY: OrderConfirmed (Kafka)
    ORD--)INV: OrderConfirmed
    ORD--)UI: notification
    CHK-->>UI: 200 {orderId, orderNumber}
```

### Compensation

| Failed step | Compensation |
|---|---|
| Price validation | none — nothing reserved yet |
| Inventory reservation | none |
| Tax | release reservation |
| Order creation | release reservation |
| Payment authorisation | release reservation, cancel order `PAYMENT_FAILED` |
| Inventory allocation | void/refund payment, cancel order |

### Rules

- **Reservations expire.** A reservation holds stock for a bounded window (15 minutes)
  and is swept if the saga dies mid-flight. Without expiry, an abandoned checkout
  removes stock permanently.
- **Idempotency.** The client generates one `Idempotency-Key` per checkout attempt.
  Replaying it returns the original result rather than creating a second order or
  charging twice.
- **Prices are revalidated server-side** against `pricing-service`, never taken from
  the cart, which may be days old.
- **Snapshots are written at order creation**, not resolved later.

## Failure modes to test

| Scenario | Expected |
|---|---|
| Price changed between cart and checkout | 409, cart updated, nothing reserved |
| Stock exhausted mid-checkout | 409, no order created |
| Payment gateway times out | Reservation released, order `PAYMENT_FAILED`, no charge |
| Payment succeeds, allocation fails | Refund issued, order cancelled, customer notified |
| Customer submits twice (double-click) | One order, one charge |
| Saga process dies after reserving | Reservation expires, stock returns |
