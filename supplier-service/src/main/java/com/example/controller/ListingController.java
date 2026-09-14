package com.example.controller;

import com.example.dto.ListingDtos.CreateListingRequest;
import com.example.dto.ListingDtos.ListingResponse;
import com.example.dto.ListingDtos.UpdateListingRequest;
import com.example.service.ListingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Links from catalogue items to partner SKUs. Cost prices are private: admin only at the BFF. */
@RestController
@RequestMapping("/api/dropship/listings")
public class ListingController {

    private final ListingService listings;

    public ListingController(ListingService listings) {
        this.listings = listings;
    }

    @GetMapping
    public List<ListingResponse> list(@RequestParam(name = "partnerCode", required = false) String partnerCode) {
        return listings.list(partnerCode);
    }

    @GetMapping("/item/{itemId}")
    public ListingResponse forItem(@PathVariable("itemId") Long itemId) {
        return listings.forItem(itemId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ListingResponse create(@Valid @RequestBody CreateListingRequest request) {
        return listings.create(request);
    }

    @PutMapping("/{id}")
    public ListingResponse update(@PathVariable("id") Long id, @Valid @RequestBody UpdateListingRequest request) {
        return listings.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") Long id) {
        listings.delete(id);
    }
}
