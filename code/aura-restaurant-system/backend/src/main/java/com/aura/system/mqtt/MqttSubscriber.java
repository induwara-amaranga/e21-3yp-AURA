package com.aura.system.mqtt;

import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;

@Component
public class MqttSubscriber {
    private final String brokerUrl = "tcp://localhost:1883";

    @PostConstruct
    public void subscribe() {
        try {
            MqttClient client = new MqttClient(brokerUrl, MqttClient.generateClientId());
            client.connect();
            client.subscribe("aura/orders", (topic, message) -> {
                System.out.println("Message received: " + new String(message.getPayload()));
            });
        } catch (MqttException e) {
            e.printStackTrace();
        }
    }
}