package com.aura.system.services;

import com.aura.system.dtos.request.CreateReservationRequest;
import com.aura.system.dtos.response.ReservationResponse;
import com.aura.system.dtos.response.TableAvailabilityResponse;
import java.time.LocalDateTime;
import java.util.List;

public interface ReservationService {
    ReservationResponse createReservation(CreateReservationRequest request);
    List<ReservationResponse> getAllReservations();
    ReservationResponse getReservationById(Integer reservationId);
    TableAvailabilityResponse checkTableAvailability(Integer tableId, LocalDateTime time);
    ReservationResponse cancelReservation(Integer reservationId);
}