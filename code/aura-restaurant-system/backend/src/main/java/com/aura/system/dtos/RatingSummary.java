package com.aura.system.dtos;

public record RatingSummary(
        Integer menuItemId,
        Double average,
        Long counts
) {}