package com.aura.system.scheduling;

import com.aura.system.services.DashboardStatsService;
import com.aura.system.services.RobotFleetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled tasks for publishing dashboard statistics and robot fleet status.
 * 
 * Publishes to MQTT topics:
 * - aura/admin/stats — Dashboard metrics (every 5 seconds)
 * - aura/admin/robots — Robot fleet status (every 5 seconds)
 */
@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class DashboardStatsScheduler {

    private final DashboardStatsService dashboardStatsService;
    private final RobotFleetService robotFleetService;

    /**
     * Publish dashboard stats every 5 seconds (5000 ms).
     * Includes: confirmed revenue, active order count, pending order total.
     */
    @Scheduled(fixedDelay = 5000, initialDelay = 2000)
    public void publishDashboardStatsTask() {
        try {
            dashboardStatsService.publishDashboardStats();
        } catch (Exception e) {
            log.error("Scheduler error while publishing dashboard stats: {}", e.getMessage(), e);
        }
    }

    /**
     * Publish robot fleet status every 5 seconds (5000 ms).
     * Includes: robot IDs, status, battery, delivery counts.
     */
    @Scheduled(fixedDelay = 5000, initialDelay = 3000)
    public void publishRobotFleetTask() {
        try {
            robotFleetService.publishRobotFleetStatus();
        } catch (Exception e) {
            log.error("Scheduler error while publishing robot fleet: {}", e.getMessage(), e);
        }
    }
}
