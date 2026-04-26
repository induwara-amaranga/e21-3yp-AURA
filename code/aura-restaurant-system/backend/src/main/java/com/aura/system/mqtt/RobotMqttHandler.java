package com.aura.system.mqtt;

import com.aura.service.AuthService;
import com.aura.system.dtos.request.PlaceOrderRequest;
import com.aura.system.entities.Robot;
import com.aura.system.repositories.RobotRepository;
import com.aura.system.dtos.request.PaymentDtos.CreatePaymentRequest;
import com.aura.system.services.MenuItemService;
import com.aura.system.services.OrderService;
import com.aura.system.services.PaymentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;


import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class RobotMqttHandler {

    private final AuthService      authService;
    private final MenuItemService  menuItemService;
    private final OrderService     orderService;
    private final PaymentService   paymentService;

    private final MqttGateway  mqttGateway;
    private final ObjectMapper objectMapper;
    private final RobotRepository robotRepository;

    @ServiceActivator(inputChannel = "mqttInputChannel")
    public void handleMessage(Message<String> message) {
        String topic   = (String) message.getHeaders().get(MqttHeaders.RECEIVED_TOPIC);
        String payload = message.getPayload();
        String responseTopic = null;

        log.info("MQTT received | topic: {} | payload: {}", topic, payload);

        if (topic == null || topic.isBlank()) {
            log.warn("MQTT message received without a topic header");
            return;
        }

        try {
            if (topic.equals("aura/robot/login")) {
                responseTopic = "aura/robot/login/response";
                handleLogin(payload, responseTopic);

            } else if (topic.matches("aura/table/\\d+/menu")) {
                String tableId = topic.split("/")[2];
                responseTopic = "aura/table/" + tableId + "/menu/response";
                handleGetMenu(tableId, responseTopic);

            } else if (topic.matches("aura/kitchen/\\d+/order") || topic.matches("aura/table/\\d+/order")) {
                String tableId = topic.split("/")[2];
                responseTopic = "aura/table/" + tableId + "/order/response";
                handlePlaceOrder(tableId, payload, responseTopic);

            } else if (topic.matches("aura/table/\\d+/payment")) {
                String tableId = topic.split("/")[2];
                responseTopic = "aura/table/" + tableId + "/payment/response";
                handlePayment(tableId, payload, responseTopic);

            } else if (topic.matches("aura/robot/.+/status") || topic.matches("aura/robot/.+")) {
                String robotId = topic.split("/")[2];
                handleRobotStatus(robotId, payload);

            } else {
                log.warn("Unknown topic: {}", topic);
            }

        } catch (Exception e) {
            log.error("Error handling MQTT message on topic {}: {}", topic, e.getMessage(), e);
            if (responseTopic != null) {
                sendError(responseTopic, e.getMessage());
            }
        }
    }


    private void handleLogin(String payload, String responseTopic) throws Exception {
        Map<?, ?> creds = objectMapper.readValue(payload, Map.class);

        var request = new com.aura.dto.AuthDtos.LoginRequest(
            (String) creds.get("username"),
            (String) creds.get("password")
        );

        var response = authService.login(request);

        String json = objectMapper.writeValueAsString(
            Map.of("status", "success", "token", response.token(), "role", response.role())
        );
        mqttGateway.sendToMqtt(json, responseTopic);
        log.info("Robot login success for user: {}", creds.get("username"));
    }


    private void handleGetMenu(String tableId, String responseTopic) throws Exception {
        var menu = menuItemService.getAvailableItems();  // reuse your existing method

        String json = objectMapper.writeValueAsString(
            Map.of("status", "success", "tableId", tableId, "menu", menu)
        );
        mqttGateway.sendToMqtt(json, responseTopic);
        log.info("Menu sent to table {}", tableId);
    }


    private void handlePlaceOrder(String tableId, String payload, String responseTopic) throws Exception {
        PlaceOrderRequest request = objectMapper.readValue(payload, PlaceOrderRequest.class);

        Integer topicTableId;
        try {
            topicTableId = Integer.valueOf(tableId);
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Invalid table id in topic: " + tableId);
        }

        // Frontend/PI can occasionally send null tableId. Use topic table id as source of truth.
        if (request.getTableId() == null) {
            request.setTableId(topicTableId);
        } else if (!request.getTableId().equals(topicTableId)) {
            throw new IllegalArgumentException(
                    "Table ID mismatch between topic and payload: topic="
                            + topicTableId + ", payload=" + request.getTableId());
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Order must contain at least one item");
        }

        var order = orderService.placeOrder(request);  // reuse your existing service

        String json = objectMapper.writeValueAsString(
            Map.of("status", "success", "tableId", tableId, "order", order)
        );
        mqttGateway.sendToMqtt(json, responseTopic);
        log.info("Order placed for table {}: orderId={}", tableId, order.getOrderId());
    }

    private void handlePayment(String tableId, String payload, String responseTopic) throws Exception {
        CreatePaymentRequest request = objectMapper.readValue(payload, CreatePaymentRequest.class);

        var result = paymentService.recordPayment(request);  // reuse your existing service

        String json = objectMapper.writeValueAsString(
            Map.of("status", "success", "tableId", tableId, "payment", result)
        );
        mqttGateway.sendToMqtt(json, responseTopic);
        log.info("Payment processed for table {}", tableId);
    }


    private void handleRobotStatus(String robotId, String payload) throws Exception {
        Map<?, ?> status = objectMapper.readValue(payload, Map.class);
        Object rawDeviceStatus = status.get("state") != null ? status.get("state") : status.get("status");

        if (status.get("battery") == null || status.get("location") == null || rawDeviceStatus == null) {
            throw new IllegalArgumentException("Robot status payload must contain battery, location and state/status fields");
        }

        log.info("Robot [{}] status: battery={}%, location={}, state={}",
            robotId,
            status.get("battery"),
            status.get("location"),
            rawDeviceStatus
        );

        Robot robot = new Robot();
        robot.setBatteryLevel(status.get("battery").toString());
        robot.setLocation(status.get("location").toString());
        robot.setDeviceStatus(rawDeviceStatus.toString());

        robotRepository.save(robot);
        
        log.info("Robot [{}] data saved to database successfully!", robotId);
    }

    private void sendError(String responseTopic, String errorMessage) {
        try {
            String json = objectMapper.writeValueAsString(
                Map.of("status", "error", "message", errorMessage)
            );
            mqttGateway.sendToMqtt(json, responseTopic);
        } catch (Exception e) {
            log.error("Failed to send error response", e);
        }
    }
}
