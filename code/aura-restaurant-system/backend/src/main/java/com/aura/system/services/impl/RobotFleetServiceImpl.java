package com.aura.system.services.impl;

import com.aura.system.dtos.response.RobotStatusResponse;
import com.aura.system.entities.Robot;
import com.aura.system.repositories.RobotRepository;
import com.aura.system.mqtt.MqttPublisher;
import com.aura.system.services.RobotFleetService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Implementation of RobotFleetService.
 * Manages robot status and publishes fleet status via MQTT.
 * Tracks delivery counts in memory (should be persisted in DB for production).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RobotFleetServiceImpl implements RobotFleetService {

    private final RobotRepository robotRepository;
    private final MqttPublisher mqttPublisher;
    private final ObjectMapper objectMapper;

    // In-memory tracking of delivery counts (for demo; persist to DB in production)
    private final Map<Integer, Integer> deliveryCountMap = new ConcurrentHashMap<>();

    private static final String FLEET_TOPIC = "aura/admin/robots";

    /**
     * Publish current robot fleet status to MQTT.
     * Called periodically or after robot status changes.
     */
    @Override
    public void publishRobotFleetStatus() {
        try {
            List<RobotStatusResponse> fleet = getRobotFleetStatus();
            
            Map<String, Object> payload = new HashMap<>();
            payload.put("robots", fleet);
            
            String json = objectMapper.writeValueAsString(payload);
            mqttPublisher.publish(FLEET_TOPIC, json);
            log.info("🤖 Published robot fleet status: {} robots", fleet.size());
        } catch (Exception e) {
            log.error("Failed to publish robot fleet status: {}", e.getMessage(), e);
        }
    }

    /**
     * Get all robots' current status.
     * Converts Robot entities to DTOs with battery percentage and delivery counts.
     */
    @Override
    public List<RobotStatusResponse> getRobotFleetStatus() {
        List<RobotStatusResponse> fleet = new ArrayList<>();
        
        try {
            List<Robot> robots = robotRepository.findAll();
            
            for (Robot robot : robots) {
                RobotStatusResponse status = RobotStatusResponse.builder()
                    .robotId(String.format("AURA-%02d", robot.getRobotId()))
                    .deviceStatus(mapRobotStatus(robot.getDeviceStatus()))
                    .batteryPercentage(parseBatteryPercentage(robot.getBatteryLevel()))
                    .deliveryCount(deliveryCountMap.getOrDefault(robot.getRobotId(), 0))
                    .location(robot.getLocation())
                    .build();
                
                fleet.add(status);
            }
            
            log.debug("Retrieved robot fleet status: {} robots", fleet.size());
        } catch (Exception e) {
            log.error("Error retrieving robot fleet status: {}", e.getMessage(), e);
        }
        
        return fleet;
    }

    /**
     * Increment delivery count for a robot.
     * Called when an order is successfully delivered.
     */
    @Override
    public void incrementRobotDeliveryCount(Integer robotId) {
        try {
            deliveryCountMap.put(robotId, 
                deliveryCountMap.getOrDefault(robotId, 0) + 1);
            
            // Republish updated fleet status
            publishRobotFleetStatus();
            
            log.info("Incremented delivery count for robot: {}", robotId);
        } catch (Exception e) {
            log.error("Error incrementing delivery count: {}", e.getMessage(), e);
        }
    }

    /**
     * Parse battery percentage from string.
     * Expected format: "85%" or "85"
     */
    private Integer parseBatteryPercentage(String batteryLevel) {
        if (batteryLevel == null || batteryLevel.isEmpty()) {
            return 50; // Default
        }
        
        try {
            String clean = batteryLevel.replaceAll("[^0-9]", "");
            return Integer.parseInt(clean);
        } catch (NumberFormatException e) {
            log.warn("Could not parse battery level: {}", batteryLevel);
            return 50; // Default
        }
    }

    /**
     * Map database status to frontend-friendly status.
     */
    private String mapRobotStatus(String dbStatus) {
        if (dbStatus == null) return "idle";
        
        return switch (dbStatus.toLowerCase()) {
            case "delivering", "in_transit" -> "delivering";
            case "charging" -> "charging";
            default -> "idle";
        };
    }
}
