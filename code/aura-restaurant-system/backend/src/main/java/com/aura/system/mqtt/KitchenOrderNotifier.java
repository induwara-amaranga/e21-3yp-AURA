package com.aura.system.mqtt;

import com.aura.system.services.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class KitchenOrderNotifier {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    // Topics that indicate a new order for kitchen
    private static final String[] ORDER_TOPICS = {
        "aura/kitchen/+/order",
        "aura/table/+/order"
    };

    @ServiceActivator(inputChannel = "mqttInputChannel")
    public void handleOrderMessage(Message<String> message) {
        String topic = (String) message.getHeaders().get(MqttHeaders.RECEIVED_TOPIC);
        String payload = message.getPayload();

        log.info("KitchenOrderNotifier received | topic: {}", topic);

        if (topic == null || payload == null) {
            return;
        }

        // Check if this is an order-related topic
        boolean isOrderTopic = false;
        for (String orderTopic : ORDER_TOPICS) {
            // Convert MQTT wildcard to regex for matching
            String regex = orderTopic.replace("+", "[^/]+");
            if (topic.matches(regex)) {
                isOrderTopic = true;
                break;
            }
        }

        if (isOrderTopic) {
            try {
                // Parse the order payload
                Map<?, ?> orderData = objectMapper.readValue(payload, Map.class);
                
                // Broadcast to kitchen dashboard via WebSocket
                Map<String, Object> notification = Map.of(
                    "type", "NEW_ORDER",
                    "topic", topic,
                    "payload", orderData,
                    "timestamp", System.currentTimeMillis()
                );

                // Send to /topic/kitchen/orders - all subscribed clients will receive
                messagingTemplate.convertAndSend("/topic/kitchen/orders", (Object) notification);

                log.info("✅ Order broadcast to kitchen via WebSocket: {}", topic);

            } catch (Exception e) {
                log.error("Failed to broadcast order to kitchen: {}", e.getMessage(), e);
            }
        }
    }
}