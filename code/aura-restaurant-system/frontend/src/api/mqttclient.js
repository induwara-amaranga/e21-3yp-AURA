// src/api/mqttClient.js
import mqtt from 'mqtt';

class KitchenMqttService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.listeners = {
      onNewOrder: [],
      onOrderStatusUpdate: [],
      onMenuUpdate: [],
      onError: [],
    };
  }

  connect() {
    if (this.connected) return;

    // WebSocket port 9001 — not TCP 1883
    this.client = mqtt.connect('ws://localhost:9001');

    this.client.on('connect', () => {
      console.log('✅ MQTT connected via WebSocket');
      this.connected = true;

      // Subscribe to kitchen topic
      this.client.subscribe('aura/kitchen/new-order');
      this.client.subscribe('aura/table/+/order/response');
      // Subscribe to menu updates
      this.client.subscribe('aura/menu/updated');
    });

    this.client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('📦 MQTT message received:', topic, data);

        if (topic === 'aura/kitchen/update-order') {
          this.listeners.onNewOrder.forEach(cb => cb(data));
        } else if (topic.includes('/order/response')) {
          this.listeners.onOrderStatusUpdate.forEach(cb => cb(data));
        } else if (topic === 'aura/menu/updated') {
          this.listeners.onMenuUpdate.forEach(cb => cb(data));
        }
      } catch (e) {
        console.error('Failed to parse MQTT message:', e);
      }
    });

    this.client.on('error', (error) => {
      console.error('❌ MQTT error:', error);
      this.connected = false;
      this.listeners.onError.forEach(cb => cb(error));
    });

    this.client.on('reconnect', () => {
      console.log('🔄 MQTT reconnecting...');
    });
  }

  onNewOrder(callback) {
    this.listeners.onNewOrder.push(callback);
    return () => {
      this.listeners.onNewOrder =
        this.listeners.onNewOrder.filter(cb => cb !== callback);
    };
  }

  onOrderStatusUpdate(callback) {
    this.listeners.onOrderStatusUpdate.push(callback);
    return () => {
      this.listeners.onOrderStatusUpdate =
        this.listeners.onOrderStatusUpdate.filter(cb => cb !== callback);
    };
  }

  onMenuUpdate(callback) {
    this.listeners.onMenuUpdate.push(callback);
    return () => {
      this.listeners.onMenuUpdate =
        this.listeners.onMenuUpdate.filter(cb => cb !== callback);
    };
  }

  onError(callback) {
    this.listeners.onError.push(callback);
    return () => {
      this.listeners.onError =
        this.listeners.onError.filter(cb => cb !== callback);
    };
  }

  disconnect() {
    this.client?.end();
    this.connected = false;
    console.log('🔌 MQTT disconnected');
  }

  isConnected() {
    return this.connected;
  }
}

export const orderMqtt = new KitchenMqttService();
export default orderMqtt;