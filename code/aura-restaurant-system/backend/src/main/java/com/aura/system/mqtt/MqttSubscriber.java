package com.aura.system.mqtt;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Subscriptions are now managed by MqttConfig.inboundAdapter().
 * All messages route to RobotMqttHandler via mqttInputChannel.
 *
 * This class is kept for any manual/programmatic publish needs.
 */
@Slf4j
@Component
public class MqttSubscriber {
    // No manual subscription needed anymore.
    // MqttConfig handles all topic subscriptions automatically on startup.
}