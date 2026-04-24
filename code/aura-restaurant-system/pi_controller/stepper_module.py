import RPi.GPIO as GPIO
import time
import os

class StepperModule:
    def __init__(self):
        # ඔබ තෝරාගත් GPIO පින් (BCM Mode)
        # Pin 16=GPIO23, Pin 18=GPIO24, Pin 22=GPIO25, Pin 24=GPIO8
        self.pins = [23, 24, 25, 8]
        
        # මෝටරයේ වේගය පාලනයට (අඩු අගයක් යනු වැඩි වේගයකි)
        self.step_delay = float(os.getenv("STEPPER_DELAY", "0.002"))

        # GPIO Setup
        GPIO.setmode(GPIO.BCM)
        for pin in self.pins:
            GPIO.setup(pin, GPIO.OUT)
            GPIO.output(pin, False)

        # 4-Phase Stepper Sequence (Half-step mode වැඩි නිවැරදිතාවයක් සඳහා)
        self.sequence = [
            [1,0,0,0], [1,1,0,0], [0,1,0,0], [0,1,1,0],
            [0,0,1,0], [0,0,1,1], [0,0,0,1], [1,0,0,1]
        ]

    def _move_steps(self, steps, direction="forward"):
        """ මෝටරය පියවර ගණනක් කරකැවීමට """
        seq = self.sequence if direction == "forward" else self.sequence[::-1]
        
        for _ in range(steps):
            for step in seq:
                for i in range(4):
                    GPIO.output(self.pins[i], step[i])
                time.sleep(self.step_delay)

    def rotate_to_direction(self, direction):
        """ ඔබේ පැරණි Servo කේතයට සමාන ශ්‍රිතය (Function) """
        # 28BYJ-48 මෝටරයක සම්පූර්ණ වටයකට (360°) පියවර 512ක් පමණ අවශ්‍ය වේ.
        # ඒ අනුව දළ වශයෙන් අගයන් පහත පරිදි වේ:
        
        move_map = {
            "front": 0,    # මුල් ස්ථානය
            "left": 128,   # 90° වමට
            "right": 128,  # 90° දකුණට
            "back": 256    # 180° පිටුපසට
        }

        if direction == "left":
            print(f"Turning Left...")
            self._move_steps(128, "forward")
        elif direction == "right":
            print(f"Turning Right...")
            self._move_steps(128, "backward")
        elif direction == "back":
            print(f"Turning Back...")
            self._move_steps(256, "forward")
        
        # පින් නිවා දැමීම (මෝටරය රත් වීම වැළැක්වීමට)
        self.hold_position()

    def hold_position(self):
        for pin in self.pins:
            GPIO.output(pin, False)

    def cleanup(self):
        self.hold_position()
        GPIO.cleanup()