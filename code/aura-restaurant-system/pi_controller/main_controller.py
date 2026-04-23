import os
from dotenv import load_dotenv

from voice_module import VoiceModule
from audio_module import AudioModule
from config import USE_WAKE_WORD, WAKE_WORD


load_dotenv()


def main():
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    if not gemini_api_key:
        print("Error: GEMINI_API_KEY environment variable is not set.")
        print("Set it first, then run again.")
        return

    voice = VoiceModule(gemini_api_key=gemini_api_key)
    audio = AudioModule()

    print("AURA voice assistant started.")

    if USE_WAKE_WORD:
        print(f"Wake word mode enabled. Say '{WAKE_WORD}' to activate.")
    else:
        print("Wake word mode disabled. Listening directly for commands.")

    while True:
        try:
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

        except KeyboardInterrupt:
            print("\nProgram stopped by user.")
            break
        except Exception as e:
            print(f"Main controller error: {e}")


if __name__ == "__main__":
    main()