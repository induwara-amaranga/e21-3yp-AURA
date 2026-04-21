package com.aura.system.services;

import com.aura.system.entities.Robot;
import java.util.List;

public interface RobotService {
    List<Robot> getAllRobots();
    Robot getRobotById(Integer id);
    List<Robot> getRobotsByStatus(String status);
    List<Robot> getRobotsByLocation(String location);
    List<Robot> getRobotsByStatusAndBattery(String status, String batteryLevel);
    Robot createRobot(Robot robot);
    Robot updateRobot(Integer id, Robot robot);
    void deleteRobot(Integer id);
}