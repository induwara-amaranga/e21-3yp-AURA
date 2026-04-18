package com.aura.system.services;

import com.aura.system.dtos.request.PlaceOrderRequest;
import com.aura.system.dtos.response.OrderResponse;
import java.util.List;

public interface OrderService {
    OrderResponse placeOrder(PlaceOrderRequest request);
    OrderResponse getOrderById(Integer orderId);
    List<OrderResponse> getOrdersByTable(Integer tableId);
    OrderResponse updateOrderStatus(Integer orderId, String status);
    List<OrderResponse> getAllOrders();
}