package com.aura.system.controllers;

import com.aura.system.dtos.request.CreateReservationRequest;
import com.aura.system.dtos.response.ReservationResponse;
import com.aura.system.dtos.response.TableAvailabilityResponse;
import com.aura.system.services.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
@Tag(name = "Reservations", description = "Manage table reservations")
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping
    @Operation(summary = "Create a reservation",
               description = "Books a table for a customer at a specific time")
    public ResponseEntity<ReservationResponse> createReservation(
            @Valid @RequestBody CreateReservationRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(reservationService.createReservation(request));
    }

    @GetMapping
    @Operation(summary = "Get all reservations",
               description = "Returns every reservation in the system")
    public ResponseEntity<List<ReservationResponse>> getAllReservations() {
        return ResponseEntity.ok(reservationService.getAllReservations());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get reservation by ID")
    public ResponseEntity<ReservationResponse> getReservation(
            @PathVariable Integer id) {
        return ResponseEntity.ok(reservationService.getReservationById(id));
    }

    @GetMapping("/availability")
    @Operation(summary = "Check table availability",
               description = "Checks if a table is free within 2 hours of the given time")
    public ResponseEntity<TableAvailabilityResponse> checkAvailability(
            @Parameter(description = "Table ID to check")
            @RequestParam Integer tableId,
            @Parameter(description = "Desired time — format: 2025-06-01T19:00:00")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime time) {
        return ResponseEntity.ok(
                reservationService.checkTableAvailability(tableId, time));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancel a reservation",
               description = "Marks an existing reservation as CANCELLED")
    public ResponseEntity<ReservationResponse> cancelReservation(
            @PathVariable Integer id) {
        return ResponseEntity.ok(reservationService.cancelReservation(id));
    }
}