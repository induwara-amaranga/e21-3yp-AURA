package com.aura.system.dtos.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class TableAvailabilityResponse {
    private Integer       tableId;
    private String        tableNumber;
    private Integer       capacity;
    private boolean       available;
    private LocalDateTime checkedFor;
    private String        reason;        // explains why unavailable if applicable
}