package com.aura.system.dtos.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

/**
 * DTO for robot status information.
 * Maps to frontend robot fleet UI.
 */
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RobotStatusResponse {
    
    @JsonProperty("id")
    private String robotId;

    @JsonProperty("status")
    private String deviceStatus;

    @JsonProperty("battery")
    private Integer batteryPercentage;

    @JsonProperty("deliveries")
    private Integer deliveryCount;

    @JsonProperty("location")
    private String location;
}
