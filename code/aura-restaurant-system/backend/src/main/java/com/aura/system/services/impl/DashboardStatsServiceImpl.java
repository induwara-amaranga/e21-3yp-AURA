package com.aura.system.services.impl;

import com.aura.system.repositories.OrderRepository;
import com.aura.system.repositories.PaymentRepository;
import com.aura.system.mqtt.MqttPublisher;
import com.aura.system.services.DashboardStatsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

/**
 * Implementation of DashboardStatsService.
 * Calculates real-time metrics for the admin dashboard and publishes via MQTT.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardStatsServiceImpl implements DashboardStatsService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final MqttPublisher mqttPublisher;
    private final ObjectMapper objectMapper;

    private static final String STATS_TOPIC = "aura/admin/stats";

    /**
     * Publish current dashboard stats to MQTT.
     * Called periodically by scheduled task or after order/payment events.
     */
    @Override
    public void publishDashboardStats() {
        try {
            Map<String, Object> stats = getDashboardStats();
            String payload = objectMapper.writeValueAsString(stats);
            mqttPublisher.publish(STATS_TOPIC, payload);
            log.info("📊 Published dashboard stats: {}", payload);
        } catch (Exception e) {
            log.error("Failed to publish dashboard stats: {}", e.getMessage(), e);
        }
    }

    /**
     * Calculate current dashboard statistics.
     * 
     * Stats include:
     * - confirmedRevenue: Sum of all PAID payments
     * - activeOrderCount: Count of PENDING + PREPARING orders
     * - pendingTotal: Sum of unpaid orders (PENDING + PREPARING)
     */
    @Override
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        try {
            // 1. Confirmed Revenue — Sum of paid payments
            Float confirmedRevenue = paymentRepository.getTotalRevenueByStatus("paid");
            if (confirmedRevenue == null) {
                confirmedRevenue = 0.0f;
            }
            stats.put("confirmedRevenue", confirmedRevenue);

            // 2. Active Order Count — PENDING + PREPARING orders
            int pendingCount = orderRepository.findByStatus("PENDING").size();
            int preparingCount = orderRepository.findByStatus("PREPARING").size();
            int activeOrderCount = pendingCount + preparingCount;
            stats.put("activeOrderCount", activeOrderCount);

            // 3. Pending Order Total — Sum of unpaid orders
            float pendingTotal = 0.0f;
            var pendingOrders = orderRepository.findByStatus("PENDING");
            for (var order : pendingOrders) {
                pendingTotal += order.getTotalAmount() != null ? order.getTotalAmount() : 0.0f;
            }
            var preparingOrders = orderRepository.findByStatus("PREPARING");
            for (var order : preparingOrders) {
                pendingTotal += order.getTotalAmount() != null ? order.getTotalAmount() : 0.0f;
            }
            stats.put("pendingTotal", pendingTotal);

            log.debug("Dashboard stats calculated | Revenue: ${}, Active Orders: {}, Pending: ${}", 
                confirmedRevenue, activeOrderCount, pendingTotal);

        } catch (Exception e) {
            log.error("Error calculating dashboard stats: {}", e.getMessage(), e);
            // Return zeros on error to prevent null values
            stats.put("confirmedRevenue", 0.0f);
            stats.put("activeOrderCount", 0);
            stats.put("pendingTotal", 0.0f);
        }

        return stats;
    }
}
