package com.aura.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Response DTO for GET /admin/revenue */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueResponse {

    private double total;
    private String currency;
}
