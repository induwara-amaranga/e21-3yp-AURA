import time
import RPi.GPIO as GPIO
from touch_module import TouchModule
from servo_module import ServoModule


def main():
    touch = TouchModule()
    servo = ServoModule()

    print("Touch and Servo Diagnostic Started")
    print("Wiring expected:")
    print("  front -> physical pin 31 (BCM 6)")
    print("  back  -> physical pin 32 (BCM 12)")
    print("  left  -> physical pin 33 (BCM 13)")
    print("  right -> physical pin 37 (BCM 26)")
    print("  servo signal -> physical pin 12 (BCM 18)")
    print(f"  touch active_high -> {touch.active_high}")
    print(f"  servo freq -> {servo.frequency_hz} Hz")
    print(f"  servo pulse range -> {servo.min_pulse_ms}ms to {servo.max_pulse_ms}ms")
    print(f"  servo hold time -> {servo.move_hold_seconds}s")
    print("Press Ctrl+C to stop.\n")

    print("Step 1/2: Servo self-check sweep (front -> left -> right -> back -> front)")
    for direction in ["front", "left", "right", "back", "front"]:
        print(f"  moving: {direction}")
        servo.rotate_to_direction(direction)
        time.sleep(0.4)

    print("\nStep 2/2: Live touch test")
    print("Touch one pad at a time. Script prints raw pin states and moves servo.")

    try:
        last_direction = None
        last_trigger_time = 0.0
        debounce_seconds = 0.35

        while True:
            raw_states = touch.get_raw_states()
            direction = touch.get_touched_direction()

            if direction:
                now = time.time()
                if direction != last_direction or (now - last_trigger_time) > debounce_seconds:
                    print(f"Touch detected: {direction} | raw={raw_states}")
                    servo.rotate_to_direction(direction)
                    last_direction = direction
                    last_trigger_time = now

            time.sleep(0.08)
    except KeyboardInterrupt:
        print("\nTest stopped by user.")
    finally:
        servo.cleanup()
        GPIO.cleanup()

if __name__ == "__main__":
    main()