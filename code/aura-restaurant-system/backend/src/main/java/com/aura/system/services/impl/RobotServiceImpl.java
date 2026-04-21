package com.aura.system.services.impl;

import com.aura.system.entities.Robot;
import com.aura.system.services.RobotService;
import com.aura.system.repositories.RobotRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RobotServiceImpl implements RobotService {

    private final RobotRepository robotRepository;

    @Override
    public List<Robot> getAllRobots() {
        return robotRepository.findAll();
    }

    @Override
    public Robot getRobotById(Integer id) {
        return robotRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Robot not found with id: " + id));
    }

    @Override
    public List<Robot> getRobotsByStatus(String status) {
        return robotRepository.findByDeviceStatus(status);
    }

    @Override
    public List<Robot> getRobotsByLocation(String location) {
        return robotRepository.findByLocation(location);
    }

    @Override
    public List<Robot> getRobotsByStatusAndBattery(String status, String batteryLevel) {
        return robotRepository.findByDeviceStatusAndBatteryLevel(status, batteryLevel);
    }

    @Override
    public Robot createRobot(Robot robot) {
        return robotRepository.save(robot);
    }

    @Override
    public Robot updateRobot(Integer id, Robot updated) {
        Robot existing = getRobotById(id);
        existing.setDeviceStatus(updated.getDeviceStatus());
        existing.setLocation(updated.getLocation());
        existing.setBatteryLevel(updated.getBatteryLevel());
        return robotRepository.save(existing);
    }

    @Override
    public void deleteRobot(Integer id) {
        getRobotById(id); // throws if not found
        robotRepository.deleteById(id);
    }
}