package com.aura.system.dtos.response;

import java.time.LocalDateTime;

public record PaymentResponse(
        Integer paymentId,
        Integer orderId,
        Integer tableId,
        Float amount,
        String paymentMethod,
        String paymentStatus,
        LocalDateTime paymentTime
) {}
