package com.aura.system.controllers;

import com.aura.system.entities.Robot;
import com.aura.system.services.RobotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/robots")
@RequiredArgsConstructor
public class RobotController {

    private final RobotService robotService;

    // GET /api/robots
    @GetMapping
    public ResponseEntity<List<Robot>> getAllRobots() {
        return ResponseEntity.ok(robotService.getAllRobots());
    }

    // GET /api/robots/1
    @GetMapping("/{id}")
    public ResponseEntity<Robot> getRobotById(@PathVariable Integer id) {
        return ResponseEntity.ok(robotService.getRobotById(id));
    }

    // GET /api/robots/status/active
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Robot>> getRobotsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(robotService.getRobotsByStatus(status));
    }

    // GET /api/robots/location/table-3
    @GetMapping("/location/{location}")
    public ResponseEntity<List<Robot>> getRobotsByLocation(@PathVariable String location) {
        return ResponseEntity.ok(robotService.getRobotsByLocation(location));
    }

    // GET /api/robots/filter?status=active&batteryLevel=high
    @GetMapping("/filter")
    public ResponseEntity<List<Robot>> getRobotsByStatusAndBattery(
            @RequestParam String status,
            @RequestParam String batteryLevel) {
        return ResponseEntity.ok(robotService.getRobotsByStatusAndBattery(status, batteryLevel));
    }

    // POST /api/robots
    @PostMapping
    public ResponseEntity<Robot> createRobot(@RequestBody Robot robot) {
        return ResponseEntity.status(HttpStatus.CREATED).body(robotService.createRobot(robot));
    }

    // PUT /api/robots/1
    @PutMapping("/{id}")
    public ResponseEntity<Robot> updateRobot(@PathVariable Integer id, @RequestBody Robot robot) {
        return ResponseEntity.ok(robotService.updateRobot(id, robot));
    }

    // DELETE /api/robots/1
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRobot(@PathVariable Integer id) {
        robotService.deleteRobot(id);
        return ResponseEntity.noContent().build();
    }
}