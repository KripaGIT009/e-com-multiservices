package com.example.service;

import com.example.dto.DtoMapper;
import com.example.dto.ListingDtos.CreateListingRequest;
import com.example.dto.ListingDtos.ListingResponse;
import com.example.dto.ListingDtos.UpdateListingRequest;
import com.example.entity.DropshipListing;
import com.example.entity.DropshipPartner;
import com.example.repository.DropshipListingRepository;
import com.example.repository.DropshipPartnerRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ListingService {

    private final DropshipListingRepository listings;
    private final DropshipPartnerRepository partners;

    public ListingService(DropshipListingRepository listings, DropshipPartnerRepository partners) {
        this.listings = listings;
        this.partners = partners;
    }

    @Transactional(readOnly = true)
    public List<ListingResponse> list(String partnerCode) {
        List<DropshipListing> rows = partnerCode == null || partnerCode.isBlank()
            ? listings.findAllByOrderByIdDesc()
            : listings.findByPartnerCodeOrderByIdDesc(partnerCode.trim());
        return rows.stream().map(DtoMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ListingResponse forItem(Long itemId) {
        return listings.findByItemId(itemId).map(DtoMapper::toResponse).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Item " + itemId + " has no dropship listing"));
    }

    @Transactional
    public ListingResponse create(CreateListingRequest r) {
        String partnerCode = r.partnerCode().trim();
        DropshipPartner partner = partners.findByCode(partnerCode).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown dropship partner: " + partnerCode));
        if (!partner.isActive()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "Dropship partner " + partner.getName() + " is inactive");
        }
        requirePositive(r.costPrice());
        String sku = r.partnerSku().trim();
        if (listings.existsByItemId(r.itemId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Item " + r.itemId() + " is already linked to a dropship listing");
        }
        if (listings.existsByPartnerCodeAndPartnerSku(partnerCode, sku)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, partnerCode + " SKU " + sku + " is already linked");
        }
        DropshipListing l = new DropshipListing();
        l.setItemId(r.itemId());
        l.setPartnerCode(partnerCode);
        l.setPartnerSku(sku);
        l.setCostPrice(r.costPrice());
        l.setPartnerStock(r.partnerStock());
        l.setActive(true);
        return DtoMapper.toResponse(saveOrConflict(l));
    }

    /** Patch: a null field is left as it is. The partner and item of a listing never change. */
    @Transactional
    public ListingResponse update(Long id, UpdateListingRequest r) {
        DropshipListing l = find(id);
        if (r.partnerSku() != null) {
            String sku = r.partnerSku().trim();
            if (sku.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "partnerSku cannot be blank");
            if (!sku.equals(l.getPartnerSku()) && listings.existsByPartnerCodeAndPartnerSku(l.getPartnerCode(), sku)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, l.getPartnerCode() + " SKU " + sku + " is already linked");
            }
            l.setPartnerSku(sku);
        }
        if (r.costPrice() != null) {
            requirePositive(r.costPrice());
            l.setCostPrice(r.costPrice());
        }
        if (r.partnerStock() != null) l.setPartnerStock(r.partnerStock());
        if (r.active() != null) l.setActive(r.active());
        return DtoMapper.toResponse(saveOrConflict(l));
    }

    @Transactional
    public void delete(Long id) {
        listings.delete(find(id));
    }

    private DropshipListing saveOrConflict(DropshipListing l) {
        try {
            return listings.saveAndFlush(l);
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Item or partner SKU is already linked");
        }
    }

    private DropshipListing find(Long id) {
        return listings.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Dropship listing " + id + " not found"));
    }

    private static void requirePositive(BigDecimal costPrice) {
        if (costPrice == null || costPrice.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "costPrice must be greater than 0");
        }
        if (costPrice.stripTrailingZeros().scale() > 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "costPrice has at most 2 decimal places");
        }
    }
}
