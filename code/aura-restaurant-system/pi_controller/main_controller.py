import os
import time
import threading
import json
import asyncio
import websockets
from dotenv import load_dotenv

# --- HARDWARE IMPORTS (Restored for RPi) ---
import RPi.GPIO as GPIO
from oled_module import OLEDModule
from touch_module import TouchModule
from stepper_module import StepperModule

from mqtt_client import RobotMqttClient
from config import USE_WAKE_WORD, WAKE_WORD

load_dotenv()

# Global GPIO Setup
GPIO.setmode(GPIO.BCM)

async def frontend_handler(websocket, path, mqtt_bot):
    print("Frontend UI connected via WebSocket.")
    try:
        async for message in websocket:
            data = json.loads(message)
            if data.get("type") == "PLACE_ORDER":
                table_id = data.get("tableId", "1")
                items = data.get("items", [])
                mqtt_bot.publish_order(table_id, items)
    except websockets.exceptions.ConnectionClosedError:
        print("Frontend UI disconnected.")

def start_websocket_server(mqtt_bot):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    start_server = websockets.serve(lambda ws, path: frontend_handler(ws, path, mqtt_bot), "0.0.0.0", 8765)
    loop.run_until_complete(start_server)
    loop.run_forever()

def _touch_worker(touch, servo, oled, stop_event):
    last_direction = None
    last_trigger_time = 0.0
    debounce_seconds = 0.35

    while not stop_event.is_set():
        try:
            direction = touch.get_touched_direction()
            if direction:
                now = time.time()
                if direction != last_direction or (now - last_trigger_time) > debounce_seconds:
                    print(f"Touch detected: {direction}")
                    servo.rotate_to_direction(direction)
                    oled.look_at(direction)
                    last_direction = direction
                    last_trigger_time = now
            time.sleep(0.05)
        except Exception as e:
            print(f"Touch worker error: {e}")
            time.sleep(0.2)

def build_menu_context(menu_payload):
    if not menu_payload or not isinstance(menu_payload, dict):
        return "No menu data available."
    menu_items = menu_payload.get("menu", [])
    if not menu_items:
        return "The menu is currently empty."
    
    lines = [f"{item.get('emoji', '')} {item.get('name')} - Rs {item.get('price')} ({'Available' if item.get('availability') else 'Out of stock'})" for item in menu_items]
    return "\n".join(lines)

def main():
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    
    # --- Initialize Modules ---
    try:
        from audio_module import AudioModule
        from voice_module import VoiceModule
        audio = AudioModule()
        voice = VoiceModule(gemini_api_key=gemini_api_key) if gemini_api_key else None
    except Exception as e:
        print(f"Audio/Voice init failed: {e}")
        return

    # --- Hardware Initialization ---
    touch = TouchModule()
    servo = StepperModule()
    oled = OLEDModule()
    stop_event = threading.Event()
    
    mqtt_bot = RobotMqttClient(robot_id="aura_bot_01")
    mqtt_bot.start()

    # --- Threads ---
    threading.Thread(target=start_websocket_server, args=(mqtt_bot,), daemon=True).start()
    threading.Thread(target=_touch_worker, args=(touch, servo, oled, stop_event), daemon=True).start()

    print("AURA System Online. Listening for commands...")
    mqtt_bot.publish_status(battery=100, location="Dining Hall", state="ONLINE")

    while True:
        try:
            if voice:
                if USE_WAKE_WORD:
                    voice.listen_for_wake_word(WAKE_WORD)
                    audio.speak_text("Yes, I'm listening.")

                user_text = voice.listen_and_convert_to_text()
                if not user_text: continue

                if user_text.lower() in ["exit", "stop"]: break

                # Sync with Database via MQTT
                menu_payload = mqtt_bot.request_menu(table_id="1", timeout=3)
                menu_context = build_menu_context(menu_payload)
                
                reply = voice.get_gemini_response(user_text, menu_context=menu_context)
                audio.speak_text(reply)

        except KeyboardInterrupt:
            break

    # --- Cleanup ---
    stop_event.set()
    GPIO.cleanup()
    mqtt_bot.stop()
    print("AURA Offline.")

if __name__ == "__main__":
    main()