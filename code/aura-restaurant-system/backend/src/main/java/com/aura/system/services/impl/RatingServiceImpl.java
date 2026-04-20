package com.aura.system.services.impl;

import com.aura.system.entities.MenuItem;
import com.aura.system.entities.Rating;
import com.aura.system.services.RatingService;
import com.aura.system.repositories.MenuItemRepository;
import com.aura.system.repositories.RatingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.aura.system.dtos.RatingSummary;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RatingServiceImpl implements RatingService {

    private final RatingRepository ratingRepository;
    private final MenuItemRepository menuItemRepository;

    // Create rating
    public Rating createRating(Rating rating) {
        Integer menuItemId = rating.getMenuItem().getMenuItemId();

        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new RuntimeException("Menu item not found"));

        rating.setMenuItem(menuItem);

        return ratingRepository.save(rating);
    }

    // Get all ratings for a menu item
    public List<Rating> getRatingsByMenuItem(Integer menuItemId) {
        return ratingRepository.findByMenuItem_MenuItemId(menuItemId);
    }

    // Get rating summary (average + count)
    public RatingSummary getRatingSummary(Integer menuItemId) {
        Double avg = ratingRepository.getAverageRating(menuItemId);
        Long count = ratingRepository.countByMenuItemId(menuItemId);

        return new RatingSummary(
                menuItemId,
                avg != null ? avg : 0.0,
                count
        );
    }

    // DTO for response
    //public record RatingSummary(Integer menuItemId, Double average, Long count) {}
}