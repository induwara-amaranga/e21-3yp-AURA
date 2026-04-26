package com.aura.system.services;

import com.aura.system.dtos.response.RobotStatusResponse;
import java.util.List;

/**
 * Service for publishing real-time robot fleet status via MQTT.
 * Broadcasts robot status, battery, location, and delivery count.
 */
public interface RobotFleetService {
    /**
     * Publish current robot fleet status to MQTT topic: aura/admin/robots
     * Expected message format:
     * {
     *   "robots": [
     *     { "id": "AURA-01", "status": "delivering", "battery": 87, "deliveries": 24 },
     *     { "id": "AURA-02", "status": "idle", "battery": 95, "deliveries": 18 }
     *   ]
     * }
     */
    void publishRobotFleetStatus();

    /**
     * Get all robots' current status without publishing.
     */
    List<RobotStatusResponse> getRobotFleetStatus();

    /**
     * Update robot delivery count when an order is delivered.
     */
    void incrementRobotDeliveryCount(Integer robotId);
}
