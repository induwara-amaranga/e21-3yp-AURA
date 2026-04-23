import os
import time
import threading
import RPi.GPIO as GPIO
from dotenv import load_dotenv

GPIO.setmode(GPIO.BCM)

from voice_module import VoiceModule
from audio_module import AudioModule
from config import USE_WAKE_WORD, WAKE_WORD
from touch_module import TouchModule
from servo_module import ServoModule

load_dotenv()


def _touch_worker(touch: TouchModule, servo: ServoModule, stop_event: threading.Event):
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
                    last_direction = direction
                    last_trigger_time = now
            time.sleep(0.05)
        except Exception as e:
            print(f"Touch worker error: {e}")
            time.sleep(0.2)


def main():
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    voice = None
    if gemini_api_key:
        voice = VoiceModule(gemini_api_key=gemini_api_key)
    audio = AudioModule()
    touch = TouchModule()
    servo = ServoModule()
    stop_event = threading.Event()
    touch_thread = threading.Thread(
        target=_touch_worker,
        args=(touch, servo, stop_event),
        daemon=True,
    )
    touch_thread.start()

    print("AURA voice assistant started.")

    if voice and USE_WAKE_WORD:
        print(f"Wake word mode enabled. Say '{WAKE_WORD}' to activate.")
    else:
        print("Wake word mode disabled. Listening directly for commands.")

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

if __name__ == "__main__":
    main()