import paho.mqtt.client as mqtt
import json
import time
from config import MQTT_BROKER, MQTT_PORT

class RobotMqttClient:
    def __init__(self, robot_id="aura_bot_01"):
        self.robot_id = robot_id
        self.client = mqtt.Client(client_id=f"pi_{robot_id}")
        self.audio = audio_module
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print(f"Connected to MQTT Broker: {MQTT_BROKER}")
            # Subscribing to direct robot commands and menu responses
            self.client.subscribe(f"aura/robot/{self.robot_id}/#")
            self.client.subscribe("aura/table/+/menu/response")
        else:
            print(f"Connection failed with code {rc}")

    def on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode())
            print(f"Message received on {msg.topic}: {payload}")
            # Logic to handle incoming messages from Backend can be added here
        except Exception as e:
            print(f"Error parsing message: {e}")

    def publish_order(self, table_id, items):
        """
        Matches Backend topic: aura/table/+/order
        """
        topic = f"aura/table/{table_id}/order"
        order_payload = {
            "tableId": table_id,
            "items": items,
            "timestamp": time.time()
        }
        self.client.publish(topic, json.dumps(order_payload), qos=1)
        print(f"Order published to {topic}")

    def publish_status(self, battery, location, state):
        """
        Matches Backend topic: aura/robot/+/status
        """
        topic = f"aura/robot/{self.robot_id}/status"
        status_payload = {
            "battery": battery,
            "location": location,
            "state": state
        }
        self.client.publish(topic, json.dumps(status_payload), qos=1)

    def start(self):
        self.client.connect(MQTT_BROKER, MQTT_PORT, 60)
        self.client.loop_start()

    def stop(self):
        self.client.loop_stop()
        self.client.disconnect()