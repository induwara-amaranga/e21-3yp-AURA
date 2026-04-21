package com.aura.system.mqtt;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class MqttPublisher {

    private final MqttGateway mqttGateway;

    public MqttPublisher(MqttGateway mqttGateway) {
        this.mqttGateway = mqttGateway;
    }

    /**
     * Publish any message to any MQTT topic.
     * Uses the shared persistent connection (no reconnect overhead).
     */
    public void publish(String topic, String payload) {
        mqttGateway.sendToMqtt(payload, topic);
        log.info("📤 Published to [{}]: {}", topic, payload);
    }
}