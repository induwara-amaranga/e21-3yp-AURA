package com.aura.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Response DTO for GET /admin/stats */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {

    private double confirmedRevenue;   // total from PAID payments
    private double pendingOrderTotal;  // sum of orders not yet PAID
    private long   activeOrders;       // orders with status PENDING or PREPARING
    private double avgDeliveryMins;    // average minutes from order placed → DELIVERED
}
