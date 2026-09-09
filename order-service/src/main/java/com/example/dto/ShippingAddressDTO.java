package com.example.dto;

import lombok.*;

/** Wire shape for a delivery address, in and out. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShippingAddressDTO {
    private String fullName;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String postalCode;
    private String phone;
    private String country;
}
