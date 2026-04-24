import os
import time
import threading
import json
import asyncio
import websockets
import RPi.GPIO as GPIO
from dotenv import load_dotenv
from oled_module import OLEDModule
from mqtt_client import RobotMqttClient
from config import USE_WAKE_WORD, WAKE_WORD
from touch_module import TouchModule
from stepper_module import StepperModule
GPIO.setmode(GPIO.BCM)
load_dotenv()

async def frontend_handler(websocket, path, mqtt_bot):
    print("Frontend UI connected via WebSocket.")
    try:
        async for message in websocket:
            data = json.loads(message)
            print(f"Received from UI: {data}")
            
            # UI එකෙන් PLACE_ORDER පණිවිඩය ලැබුණු විට MQTT හරහා Backend එකට යැවීම
            if data.get("type") == "PLACE_ORDER":
                table_id = data.get("tableId", "1")
                items = data.get("items", [])
                mqtt_bot.publish_order(table_id, items)
    except websockets.exceptions.ConnectionClosedError:
        print("Frontend UI disconnected.")

def start_websocket_server(mqtt_bot):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    # 8765 port එකේ WebSocket Server එක ආරම්භ වේ
    start_server = websockets.serve(lambda ws, path: frontend_handler(ws, path, mqtt_bot), "0.0.0.0", 8765)
    loop.run_until_complete(start_server)
    loop.run_forever()

def _touch_worker(
    touch: TouchModule,
    servo: ServoModule,
    oled: OLEDModule,
    stop_event: threading.Event,
):
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


def main():
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    class _SilentAudio:
        def speak_text(self, text: str):
            print(f"AURA speaking (audio disabled): {text}")

    voice = None
    audio = _SilentAudio()

    try:
        from audio_module import AudioModule
        audio = AudioModule()
    except ModuleNotFoundError as e:
        print(f"Audio disabled (missing dependency): {e}")
        print("Tip: run with venv Python -> ./venv/bin/python main_controller.py")
    except Exception as e:
        print(f"Audio disabled (initialization error): {e}")

    if gemini_api_key:
        try:
            from voice_module import VoiceModule
            voice = VoiceModule(gemini_api_key=gemini_api_key)
        except ModuleNotFoundError as e:
            print(f"Voice mode disabled (missing dependency): {e}")
            print("Tip: run with venv Python -> ./venv/bin/python main_controller.py")
        except Exception as e:
            print(f"Voice mode disabled (initialization error): {e}")


    mqtt_bot = RobotMqttClient(robot_id="aura_bot_01")
    mqtt_bot.start()

    ws_thread = threading.Thread(target=start_websocket_server, args=(mqtt_bot,), daemon=True)
    ws_thread.start()

    touch = TouchModule()
    servo = StepperModule()()
    oled = OLEDModule()
    stop_event = threading.Event()
    touch_thread = threading.Thread(
        target=_touch_worker,
        args=(touch, servo, oled, stop_event),
        daemon=True,
    )
    touch_thread.start()

    print("AURA voice assistant started.")

    if voice and USE_WAKE_WORD:
        print(f"Wake word mode enabled. Say '{WAKE_WORD}' to activate.")
    else:
        print("Wake word mode disabled. Listening directly for commands.")

    mqtt_bot.publish_status(battery=100, location="Home", state="ONLINE")

    print("AURA System Started with MQTT Integration.")
    while True:
        try:
            if voice:
                if USE_WAKE_WORD:
                    voice.listen_for_wake_word(WAKE_WORD)
                    audio.speak_text("Yes, how can I help you?")

                user_text = voice.listen_and_convert_to_text()

                if not user_text:
                    continue

                if user_text.lower() in ["exit", "quit", "stop", "goodbye", "bye"]:
                    goodbye_text = "Goodbye. Have a nice day."
                    audio.speak_text(goodbye_text)
                    break

                reply = voice.get_gemini_response(user_text)
                audio.speak_text(reply)
            else:
                # Touch worker continues running even without voice mode.
                time.sleep(0.1)

        except KeyboardInterrupt:
            print("\nProgram stopped by user.")
            break
        except Exception as e:
            print(f"Main controller error: {e}")

    stop_event.set()
    touch_thread.join(timeout=1.0)
    servo.cleanup()
    GPIO.cleanup()
    mqtt_bot.stop()
if __name__ == "__main__":
    main()