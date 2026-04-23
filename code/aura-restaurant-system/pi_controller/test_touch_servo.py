import time
import RPi.GPIO as GPIO
from touch_module import TouchModule
from servo_module import ServoModule

def main():
    # Initialize modules
    touch = TouchModule()
    servo = ServoModule()

    print("Touch and Servo Test Started.")
    print("Touch a sensor (front/back/left/right) to see the servo rotate.")
    print("Press Ctrl+C to stop.")

    try:
        while True:
            direction = touch.get_touched_direction()
            if direction:
                print(f"Touch detected: {direction}")
                servo.rotate_to_direction(direction)
                print(f"Servo rotated to {direction}")
                # Small delay to prevent rapid repeated triggers
                time.sleep(0.5)
            time.sleep(0.1)  # Polling delay
    except KeyboardInterrupt:
        print("\nTest stopped by user.")
    finally:
        servo.cleanup()
        GPIO.cleanup()

if __name__ == "__main__":
    main()