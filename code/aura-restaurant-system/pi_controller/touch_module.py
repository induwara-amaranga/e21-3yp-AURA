import os
import RPi.GPIO as GPIO

class TouchModule:
    def __init__(self):
        GPIO.setmode(GPIO.BCM)
        # Touch sensor pins (BCM numbering).
        # Physical header mapping: 31->BCM6, 32->BCM12, 33->BCM13, 37->BCM26.
        self.pins = {
            6: "front",
            12: "back",
            13: "left",
            26: "right"
        }

        # Some touch boards are active-high, others are active-low.
        # Configure with env var TOUCH_ACTIVE_HIGH=1 or 0 (default: 1).
        self.active_high = os.getenv("TOUCH_ACTIVE_HIGH", "1").strip().lower() in {
            "1", "true", "yes", "y", "on"
        }
        pull_mode = GPIO.PUD_DOWN if self.active_high else GPIO.PUD_UP
        self.trigger_state = GPIO.HIGH if self.active_high else GPIO.LOW

        for pin in self.pins:
            GPIO.setup(pin, GPIO.IN, pull_up_down=pull_mode)

    def get_touched_direction(self):
        for pin, direction in self.pins.items():
            if GPIO.input(pin) == self.trigger_state:
                return direction
        return None

    def get_raw_states(self):
        return {direction: GPIO.input(pin) == self.trigger_state for pin, direction in self.pins.items()}
