import RPi.GPIO as GPIO
import time

class StepperModule:
    def __init__(self):
        # GPIO pin mapping (BCM numbering)
        self.IN1 = 23
        self.IN3 = 24
        self.IN2 = 25
        self.IN4 = 8

        self.STEPS_PER_REV = 2048
        self.RPM = 15

        # Full-step sequence: A+C, B+C, B+D, A+D
        # Columns: IN1(A), IN3(C), IN2(B), IN4(D)
        self.step_sequence = [
            [1, 0, 1, 0],
            [0, 1, 1, 0],
            [0, 1, 0, 1],
            [1, 0, 0, 1],
        ]

        self.pins = [self.IN1, self.IN3, self.IN2, self.IN4]

        # Setup GPIO
        GPIO.setmode(GPIO.BCM)
        for pin in self.pins:
            GPIO.setup(pin, GPIO.OUT)
            GPIO.output(pin, 0)

        # Track the current physical step position (0 to 2047)
        self.current_step = 0
        
        # Map directions to step positions around the 360-degree circle
        self.direction_map = {
            "front": 0,
            "right": int(self.STEPS_PER_REV * 0.25),  # 512 steps (90 degrees)
            "back":  int(self.STEPS_PER_REV * 0.50),  # 1024 steps (180 degrees)
            "left":  int(self.STEPS_PER_REV * 0.75)   # 1536 steps (270 degrees)
        }

    def step_motor(self, steps):
        direction = 1 if steps > 0 else -1
        steps = abs(steps)
        step_delay = 60 / (self.STEPS_PER_REV * self.RPM)
        seq_index = 0

        for _ in range(steps):
            for i, pin in enumerate(self.pins):
                GPIO.output(pin, self.step_sequence[seq_index][i])
            seq_index = (seq_index + direction) % len(self.step_sequence)
            time.sleep(step_delay)
            
        self.stop_motor()

    def stop_motor(self):
        """Turn off all coils to prevent the motor from overheating."""
        for pin in self.pins:
            GPIO.output(pin, 0)

    def rotate_to_direction(self, direction_name):
        """Calculates the shortest path to the target direction and moves."""
        if direction_name not in self.direction_map:
            return

        target_step = self.direction_map[direction_name]
        
        # Calculate the raw difference
        diff = target_step - self.current_step
        
        # Normalize the difference to find the shortest path (clockwise vs counter-clockwise)
        if diff > self.STEPS_PER_REV / 2:
            diff -= self.STEPS_PER_REV
        elif diff < -self.STEPS_PER_REV / 2:
            diff += self.STEPS_PER_REV
            
        steps_to_move = int(diff)
        
        if steps_to_move != 0:
            self.step_motor(steps_to_move)
            # Update the current position and keep it strictly between 0 and 2047
            self.current_step = (self.current_step + steps_to_move) % self.STEPS_PER_REV

    def cleanup(self):
        """Release GPIO resources."""
        self.stop_motor()