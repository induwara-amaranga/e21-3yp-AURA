package com.aura.system.services.impl;

import com.aura.system.dtos.request.CreateReservationRequest;
import com.aura.system.dtos.response.ReservationResponse;
import com.aura.system.dtos.response.TableAvailabilityResponse;
import com.aura.system.entities.Reservation;
import com.aura.system.entities.RestaurantTable;
import com.aura.system.services.ReservationService;
import com.aura.system.repositories.ReservationRepository;
import com.aura.system.repositories.RestaurantTableRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository    reservationRepository;
    private final RestaurantTableRepository tableRepository;

    // A reservation blocks the table for 2 hours either side
    private static final int SLOT_HOURS = 2;

    // ── Create Reservation ───────────────────────────────────────────────────

    @Override
    @Transactional
    public ReservationResponse createReservation(CreateReservationRequest request) {

        // 1. Validate table exists
        RestaurantTable table = tableRepository.findById(request.getTableId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Table not found: " + request.getTableId()));

        // 2. Check party size fits the table
        if (request.getPartySize() > table.getCapacity()) {
            throw new IllegalArgumentException(
                    "Party size " + request.getPartySize() +
                    " exceeds table capacity of " + table.getCapacity());
        }

        // 3. Check no conflicting reservation exists
        LocalDateTime windowStart = request.getReservationTime()
                .minusHours(SLOT_HOURS);
        LocalDateTime windowEnd   = request.getReservationTime()
                .plusHours(SLOT_HOURS);

        List<Reservation> conflicts = reservationRepository
                .findConflictingReservations(
                        request.getTableId(), windowStart, windowEnd);

        if (!conflicts.isEmpty()) {
            throw new IllegalStateException(
                    "Table " + table.getTableNumber() +
                    " is already reserved at that time.");
        }

        // 4. Save reservation
        Reservation reservation = Reservation.builder()
                .table(table)
                .customerName(request.getCustomerName())
                .partySize(request.getPartySize())
                .reservationTime(request.getReservationTime())
                .status("CONFIRMED")
                .build();

        Reservation saved = reservationRepository.save(reservation);
        log.info("Reservation created | id={} | table={} | time={}",
                saved.getReservationId(), table.getTableNumber(),
                request.getReservationTime());

        return mapToResponse(saved);
    }

    // ── Get All Reservations ─────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponse> getAllReservations() {
        return reservationRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ── Get By ID ────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public ReservationResponse getReservationById(Integer reservationId) {
        return mapToResponse(findOrThrow(reservationId));
    }

    // ── Check Table Availability ─────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public TableAvailabilityResponse checkTableAvailability(
            Integer tableId, LocalDateTime time) {

        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Table not found: " + tableId));

        LocalDateTime windowStart = time.minusHours(SLOT_HOURS);
        LocalDateTime windowEnd   = time.plusHours(SLOT_HOURS);

        List<Reservation> conflicts = reservationRepository
                .findConflictingReservations(tableId, windowStart, windowEnd);

        boolean available = conflicts.isEmpty();

        return TableAvailabilityResponse.builder()
                .tableId(table.getTableId())
                .tableNumber(table.getTableNumber())
                .capacity(table.getCapacity())
                .available(available)
                .checkedFor(time)
                .reason(available ? null :
                        "Already reserved between " + windowStart + " and " + windowEnd)
                .build();
    }

    // ── Cancel Reservation ───────────────────────────────────────────────────

    @Override
    @Transactional
    public ReservationResponse cancelReservation(Integer reservationId) {
        Reservation reservation = findOrThrow(reservationId);

        if ("CANCELLED".equals(reservation.getStatus())) {
            throw new IllegalStateException(
                    "Reservation " + reservationId + " is already cancelled.");
        }

        reservation.setStatus("CANCELLED");
        Reservation updated = reservationRepository.save(reservation);

        log.info("Reservation cancelled | id={}", reservationId);
        return mapToResponse(updated);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Reservation findOrThrow(Integer reservationId) {
        return reservationRepository.findById(reservationId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Reservation not found: " + reservationId));
    }

    private ReservationResponse mapToResponse(Reservation r) {
        return ReservationResponse.builder()
                .reservationId(r.getReservationId())
                .tableId(r.getTable().getTableId())
                .tableNumber(r.getTable().getTableNumber())
                .tableCapacity(r.getTable().getCapacity())
                .customerName(r.getCustomerName())
                .partySize(r.getPartySize())
                .reservationTime(r.getReservationTime())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .build();
    }
}