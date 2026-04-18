package com.aura.system.dtos.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CreateReservationRequest {

    @NotNull(message = "Table ID is required")
    private Integer tableId;

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotNull
    @Min(value = 1, message = "Party size must be at least 1")
    private Integer partySize;

    @NotNull(message = "Reservation time is required")
    @Future(message = "Reservation time must be in the future")
    private LocalDateTime reservationTime;
}