import os
import RPi.GPIO as GPIO
import time

class ServoModule:
    def __init__(self):
        self.servo_pin = int(os.getenv("SERVO_PIN", "18"))
        self.frequency_hz = int(os.getenv("SERVO_FREQUENCY_HZ", "50"))
        self.min_pulse_ms = float(os.getenv("SERVO_MIN_PULSE_MS", "0.5"))
        self.max_pulse_ms = float(os.getenv("SERVO_MAX_PULSE_MS", "2.5"))
        self.move_hold_seconds = float(os.getenv("SERVO_MOVE_HOLD_SECONDS", "0.8"))

        GPIO.setup(self.servo_pin, GPIO.OUT)
        self.pwm = GPIO.PWM(self.servo_pin, self.frequency_hz)

        # Start at neutral so many SG90/MG90-like servos can lock correctly.
        self.pwm.start(self._angle_to_duty(90))
        time.sleep(0.25)
        self.pwm.ChangeDutyCycle(0)

    def _angle_to_duty(self, angle):
        pulse_ms = self.min_pulse_ms + (angle / 180.0) * (self.max_pulse_ms - self.min_pulse_ms)
        period_ms = 1000.0 / self.frequency_hz
        return (pulse_ms / period_ms) * 100.0

    def rotate_to_direction(self, direction):
        angles = {
            "front": 90,
            "back": 180,
            "left": 30,
            "right": 150
        }
        
        angle = angles.get(direction, 90)
        angle = max(0, min(180, angle))
        duty = self._angle_to_duty(angle)
        self.pwm.ChangeDutyCycle(duty)
        time.sleep(self.move_hold_seconds)
        self.pwm.ChangeDutyCycle(0)
        print(f"Robot turned to {direction} (angle={angle}, duty={duty:.2f}%)")

    def cleanup(self):
        self.pwm.stop()