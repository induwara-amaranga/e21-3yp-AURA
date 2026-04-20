package com.aura.system.mqtt;

import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.springframework.stereotype.Component;

@Component
public class MqttPublisher {
    private final String brokerUrl = "tcp://localhost:1883";

    public void publish(String topic, String payload) {
        try (MqttClient client = new MqttClient(brokerUrl, MqttClient.generateClientId())) {
            client.connect();
            MqttMessage message = new MqttMessage(payload.getBytes());
            client.publish(topic, message);
            client.disconnect();
            System.out.println("Published: " + payload);
        } catch (MqttException e) {
            e.printStackTrace();
        }
    }
}