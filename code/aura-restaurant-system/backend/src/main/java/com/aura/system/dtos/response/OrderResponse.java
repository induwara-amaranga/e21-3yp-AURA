package com.aura.system.dtos.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class OrderResponse {
    private Integer           orderId;
    private Integer           tableId;
    private String            status;
    private Float             totalAmount;
    private LocalDateTime     orderTime;
    private List<OrderItemResponse> items;
}