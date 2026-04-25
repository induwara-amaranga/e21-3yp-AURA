import time
import threading
from luma.core.interface.serial import i2c
from luma.oled.device import ssd1306
from luma.core.render import canvas

class OLEDModule:
    def __init__(self):
        self.devices = []
        try:
            serial1 = i2c(port=1, address=0x3C)
            self.devices.append(ssd1306(serial1))
            serial2 = i2c(port=3, address=0x3C)
            self.devices.append(ssd1306(serial2))
        except Exception as e:
            print(f"OLED Init Error: {e}")

        self.current_direction = "center"
        self.is_blinking = False
        self._reset_timer = None  # To keep track of the auto-center timer
        
        if self.devices:
            threading.Thread(target=self._blink_scheduler, daemon=True).start()

    def _draw_eyes(self, draw, state="open", direction="center"):
        center_x = 64
        x_shift = {"center": 0, "left": -15, "right": 15, "front": 0, "back": 0}.get(direction, 0)
        eye_box = (44 + x_shift, 15, 84 + x_shift, 55)
        
        if state == "open":
            draw.ellipse(eye_box, fill="white")
        else:
            draw.line((44 + x_shift, 35, 84 + x_shift, 35), fill="white", width=4)

    def _blink_scheduler(self):
        while True:
            time.sleep(10)
            self.is_blinking = True
            self._update_display()
            time.sleep(0.3) 
            self.is_blinking = False
            self._update_display()

    def _update_display(self):
        for device in self.devices:
            with canvas(device) as draw:
                state = "closed" if self.is_blinking else "open"
                self._draw_eyes(draw, state=state, direction=self.current_direction)

    def look_at(self, direction):
        """Sets the direction and starts a timer to return to center."""
        self.current_direction = direction
        self._update_display()

        # If we are moving to a position other than center, start a timer to go back
        if direction != "center":
            # Cancel existing timer if a new touch happens before the old one finished
            if self._reset_timer is not None:
                self._reset_timer.cancel()

            # Set a 3-second delay before returning to center
            self._reset_timer = threading.Timer(3.0, self.look_at, args=["center"])
            self._reset_timer.start()