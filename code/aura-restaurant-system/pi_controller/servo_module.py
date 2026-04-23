import RPi.GPIO as GPIO
import time

class ServoModule:
    def __init__(self):
        self.servo_pin = 18 
        GPIO.setup(self.servo_pin, GPIO.OUT)
        self.pwm = GPIO.PWM(self.servo_pin, 50)
        self.pwm.start(0)

    def rotate_to_direction(self, direction):
        angles = {
            "front": 90,
            "back": 270,
            "left": 0,
            "right": 180
        }
        
        angle = angles.get(direction, 90)
        duty = angle / 18 + 2
        self.pwm.ChangeDutyCycle(duty)
        time.sleep(0.5)
        self.pwm.ChangeDutyCycle(0)
        print(f"Robot turned to {direction}")

    def cleanup(self):
        self.pwm.stop()