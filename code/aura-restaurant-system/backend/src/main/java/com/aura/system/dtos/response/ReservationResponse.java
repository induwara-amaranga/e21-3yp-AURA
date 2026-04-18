package com.aura.system.dtos.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ReservationResponse {
    private Integer       reservationId;
    private Integer       tableId;
    private String        tableNumber;
    private Integer       tableCapacity;
    private String        customerName;
    private Integer       partySize;
    private LocalDateTime reservationTime;
    private String        status;
    private LocalDateTime createdAt;
}