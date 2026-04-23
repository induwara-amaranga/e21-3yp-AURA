import os
import RPi.GPIO as GPIO
from dotenv import load_dotenv

GPIO.setmode(GPIO.BCM)

from voice_module import VoiceModule
from audio_module import AudioModule
from config import USE_WAKE_WORD, WAKE_WORD
from touch_module import TouchModule
from servo_module import ServoModule

load_dotenv()


def main():
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    voice = None
    if gemini_api_key:
        voice = VoiceModule(gemini_api_key=gemini_api_key)
    audio = AudioModule()
    touch = TouchModule()
    servo = ServoModule()
    print("AURA voice assistant started.")

    if voice and USE_WAKE_WORD:
        print(f"Wake word mode enabled. Say '{WAKE_WORD}' to activate.")
    else:
        print("Wake word mode disabled. Listening directly for commands.")

    while True:
        try:
            direction = touch.get_touched_direction()
            if direction:
                print(f"Touch detected: {direction}")
                servo.rotate_to_direction(direction)
                audio.speak_text(f"Turning {direction}")

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
                # For touch testing without voice
                import time
                time.sleep(0.1)  # Small delay to prevent busy loop

        except KeyboardInterrupt:
            print("\nProgram stopped by user.")
            break
        except Exception as e:
            print(f"Main controller error: {e}")

    GPIO.cleanup()

if __name__ == "__main__":
    main()