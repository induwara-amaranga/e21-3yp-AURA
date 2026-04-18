package com.aura.system.dtos.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrderItemResponse {
    private Integer orderItemId;
    private Integer menuItemId;
    private String  menuItemName;
    private Integer quantity;
    private String  customization;
    private Float   subtotal;
}