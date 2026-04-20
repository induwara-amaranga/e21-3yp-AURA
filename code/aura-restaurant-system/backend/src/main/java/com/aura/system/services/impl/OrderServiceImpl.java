package com.aura.system.services.impl;

import com.aura.system.dtos.request.OrderItemRequest;
import com.aura.system.dtos.request.PlaceOrderRequest;
import com.aura.system.dtos.response.OrderItemResponse;
import com.aura.system.dtos.response.OrderResponse;
import com.aura.system.entities.*;
import com.aura.system.repositories.*;
import com.aura.system.services.OrderService;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

//import static com.aura.system.entities.Account.Role;
//import com.aura.system.dtos.request.PlaceOrderRequest;


@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements OrderService {

    private final OrderRepository        orderRepository;
    private final OrderItemRepository    orderItemRepository;
    private final MenuItemRepository     menuItemRepository;
    private final RestaurantTableRepository tableRepository;

    // ── Place Order ──────────────────────────────────────────────────────────

    @Override
    @Transactional
    public OrderResponse placeOrder(PlaceOrderRequest request) {

        // 1. Validate table
        RestaurantTable table = tableRepository.findById(request.getTableId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Table not found: " + request.getTableId()));

        // 2. Save Order first (no cascade — entity has no @OneToMany list)
        Order order = Order.builder()
                .table(table)
                .status("PENDING")
                .totalAmount(0.0f)
                .orderTime(LocalDateTime.now())
                .build();

        Order savedOrder = orderRepository.save(order);

        // 3. Build and save each OrderItem, accumulate total
        float total = 0.0f;
        List<OrderItem> savedItems = new ArrayList<>();

        for (OrderItemRequest itemReq : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Menu item not found: " + itemReq.getMenuItemId()));

            float subtotal = menuItem.getPrice() * itemReq.getQuantity();
            total += subtotal;

            OrderItem orderItem = OrderItem.builder()
                    .order(savedOrder)
                    .menuItem(menuItem)
                    .quantity(itemReq.getQuantity())
                    .customization(itemReq.getCustomization())
                    .subtotal(subtotal)
                    .build();

            savedItems.add(orderItemRepository.save(orderItem));
        }

        // 4. Update total on the order
        savedOrder.setTotalAmount(total);
        orderRepository.save(savedOrder);

        log.info("Order placed | orderId={} | tableId={} | total={}",
                savedOrder.getOrderId(), table.getTableId(), total);

        return buildResponse(savedOrder, savedItems);
    }
    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll()
                .stream()
                .map(order -> {
                    List<OrderItem> items =
                            orderItemRepository.findByOrderOrderId(order.getOrderId());
                    return buildResponse(order, items);
                })
                .collect(Collectors.toList());
    }

    // ── Get Order By ID ──────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Integer orderId) {
        Order order = findOrThrow(orderId);
        List<OrderItem> items = orderItemRepository.findByOrderOrderId(orderId);
        return buildResponse(order, items);
    }

    // ── Get Orders By Table ──────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByTable(Integer tableId) {
        return orderRepository.findByTableTableId(tableId)
                .stream()
                .map(order -> {
                    List<OrderItem> items =
                            orderItemRepository.findByOrderOrderId(order.getOrderId());
                    return buildResponse(order, items);
                })
                .collect(Collectors.toList());
    }

    // ── Update Status ────────────────────────────────────────────────────────

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Integer orderId, String status) {
        Order order = findOrThrow(orderId);

        String oldStatus = order.getStatus();
        order.setStatus(status.toUpperCase());
        orderRepository.save(order);

        log.info("Order {} status: {} → {}", orderId, oldStatus, status.toUpperCase());

        List<OrderItem> items = orderItemRepository.findByOrderOrderId(orderId);
        return buildResponse(order, items);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Order findOrThrow(Integer orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Order not found: " + orderId));
    }

    private OrderResponse buildResponse(Order order, List<OrderItem> items) {
        List<OrderItemResponse> itemResponses = items.stream()
                .map(item -> OrderItemResponse.builder()
                        .orderItemId(item.getOrderItemId())
                        .menuItemId(item.getMenuItem().getMenuItemId())
                        .menuItemName(item.getMenuItem().getName())
                        .quantity(item.getQuantity())
                        .customization(item.getCustomization())
                        .subtotal(item.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .orderId(order.getOrderId())
                .tableId(order.getTable().getTableId())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .orderTime(order.getOrderTime())
                .items(itemResponses)
                .build();
    }
}