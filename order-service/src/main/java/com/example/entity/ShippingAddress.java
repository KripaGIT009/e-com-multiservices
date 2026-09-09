package com.example.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

/**
 * Where an order is being delivered, snapshotted at the time it was placed.
 *
 * Embedded rather than referenced: an order must still show the address it was
 * actually shipped to even after the customer edits or deletes that address from
 * their address book.
 *
 * Every column is nullable because orders created before this existed have none.
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShippingAddress {

    @Column(name = "ship_full_name", length = 120)
    private String fullName;

    @Column(name = "ship_line1", length = 200)
    private String addressLine1;

    @Column(name = "ship_line2", length = 200)
    private String addressLine2;

    @Column(name = "ship_city", length = 100)
    private String city;

    @Column(name = "ship_state", length = 100)
    private String state;

    @Column(name = "ship_postal_code", length = 20)
    private String postalCode;

    @Column(name = "ship_phone", length = 20)
    private String phone;

    @Column(name = "ship_country", length = 60)
    private String country;

    /** True once there is enough here to actually deliver to. */
    public boolean isPresent() {
        return addressLine1 != null && !addressLine1.isBlank()
            && city != null && !city.isBlank()
            && postalCode != null && !postalCode.isBlank();
    }

    /** Single-line rendering for lists and admin tables. */
    public String toSingleLine() {
        if (!isPresent()) return null;
        StringBuilder sb = new StringBuilder();
        if (addressLine1 != null) sb.append(addressLine1);
        if (addressLine2 != null && !addressLine2.isBlank()) sb.append(", ").append(addressLine2);
        if (city != null) sb.append(", ").append(city);
        if (state != null) sb.append(", ").append(state);
        if (postalCode != null) sb.append(" - ").append(postalCode);
        return sb.toString();
    }
}
