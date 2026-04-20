package com.aura.system.services;



import com.aura.system.entities.Rating;
import com.aura.system.dtos.RatingSummary;

import java.util.List;

public interface RatingService {

    Rating createRating(Rating rating);

    List<Rating> getRatingsByMenuItem(Integer menuItemId);

    RatingSummary getRatingSummary(Integer menuItemId);

    // DTO inside interface (or you can move it to separate file)
    //record RatingSummary(Integer menuItemId, Double average, Long count) {}
} 
