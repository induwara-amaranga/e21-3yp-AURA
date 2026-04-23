import RPi.GPIO as GPIO

class TouchModule:
    def __init__(self):
        # Touch sensor pins (BCM numbering)
        self.pins = {
            31: "front",
            32: "back",
            33: "left",
            37: "right"
        }
        for pin in self.pins:
            GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

    def get_touched_direction(self):
        for pin, direction in self.pins.items():
            if GPIO.input(pin) == GPIO.HIGH:
                return direction
        return None