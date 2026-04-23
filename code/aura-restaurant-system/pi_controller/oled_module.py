import time
import threading
import os
from luma.core.interface.serial import i2c
from luma.oled.device import ssd1306
from luma.core.render import canvas

class OLEDModule:
    def __init__(self):
        self.devices = []
        self._display_lock = threading.Lock()

        address_env = os.getenv("OLED_I2C_ADDRESSES", "0x3C,0x3D")
        addresses = []
        for item in address_env.split(","):
            value = item.strip()
            if not value:
                continue
            try:
                addresses.append(int(value, 0))
            except ValueError:
                print(f"Skipping invalid OLED address: {value}")

        for address in addresses:
            try:
                serial = i2c(port=1, address=address)
                self.devices.append(ssd1306(serial))
            except Exception as e:
                print(f"OLED init failed at 0x{address:02X}: {e}")

        # Backward compatibility for existing checks like `print(o.device)`.
        self.device = self.devices[0] if self.devices else None

        self.current_direction = "center"
        self.is_blinking = False
        
        if self.devices:
            threading.Thread(target=self._blink_scheduler, daemon=True).start()

    def _draw_eyes(self, draw, state="open", direction="center"):
        x_shift = {"center": 0, "left": -20, "right": 20, "front": 0, "back": 0}.get(direction, 0)

        if state == "open":
            draw.ellipse((20 + x_shift, 20, 50 + x_shift, 50), fill="white")
            draw.ellipse((78 + x_shift, 20, 108 + x_shift, 50), fill="white")
        else:
            draw.line((20 + x_shift, 35, 50 + x_shift, 35), fill="white", width=4)
            draw.line((78 + x_shift, 35, 108 + x_shift, 35), fill="white", width=4)

    def _blink_scheduler(self):
        while True:
            time.sleep(10)
            self.is_blinking = True
            self._update_display()
            time.sleep(0.3) 
            self.is_blinking = False
            self._update_display()

    def _update_display(self):
        if not self.devices:
            return

        with self._display_lock:
            state = "closed" if self.is_blinking else "open"
            for device in self.devices:
                with canvas(device) as draw:
                    self._draw_eyes(draw, state=state, direction=self.current_direction)

    def look_at(self, direction):
        self.current_direction = direction
        self._update_display()