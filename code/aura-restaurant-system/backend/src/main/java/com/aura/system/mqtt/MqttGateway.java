package com.aura.system.mqtt;

import org.springframework.integration.annotation.MessagingGateway;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.handler.annotation.Header;

@MessagingGateway(defaultRequestChannel = "mqttOutputChannel")
public interface MqttGateway {

    /**
     * Send a JSON response back to the robot on a specific topic.
     *
     * @param payload  JSON string
     * @param topic    MQTT topic (e.g. "aura/table/3/menu/response")
     */
    void sendToMqtt(String payload,
                    @Header(MqttHeaders.TOPIC) String topic);
}