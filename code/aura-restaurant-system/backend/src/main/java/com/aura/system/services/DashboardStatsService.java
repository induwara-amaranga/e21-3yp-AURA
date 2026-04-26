package com.aura.system.services;

import java.util.List;
import java.util.Map;

/**
 * Service for publishing real-time dashboard statistics via MQTT.
 * Calculates and broadcasts:
 * - Confirmed revenue (paid orders only)
 * - Active order count (PENDING, PREPARING status)
 * - Pending order total (unpaid orders)
 */
public interface DashboardStatsService {
    /**
     * Publish current dashboard stats to MQTT topic: aura/admin/stats
     * Expected message format:
     * {
     *   "confirmedRevenue": 1234.50,
     *   "activeOrderCount": 5,
     *   "pendingTotal": 567.80
     * }
     */
    void publishDashboardStats();

    /**
     * Get current dashboard stats without publishing.
     * Useful for endpoints that need to return this data.
     */
    Map<String, Object> getDashboardStats();
}
