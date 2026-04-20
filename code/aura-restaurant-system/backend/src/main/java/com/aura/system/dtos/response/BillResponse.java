package com.aura.system.dtos.response;

import java.time.LocalDateTime;

public record BillResponse(
        Integer tableId,
        Integer orderId,
        Float totalAmount,
        String orderStatus,
        LocalDateTime orderTime,
        String paymentStatus
) {}
