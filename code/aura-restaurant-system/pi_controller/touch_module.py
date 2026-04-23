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
        for pin in self.pins:
            GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

    def get_touched_direction(self):
        for pin, direction in self.pins.items():
            if GPIO.input(pin) == GPIO.HIGH:
                return direction
        return None

    def get_raw_states(self):
        return {direction: GPIO.input(pin) == GPIO.HIGH for pin, direction in self.pins.items()}
