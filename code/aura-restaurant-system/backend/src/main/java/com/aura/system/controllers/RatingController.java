package com.aura.system.controllers;

import com.aura.system.entities.Rating;
import com.aura.system.services.RatingService;
import com.aura.system.dtos.RatingSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;

    // POST /ratings
    // Body: { "menuItem": { "menuItemId": 1 }, "score": 4, "comment": "Great!" }   
    @PostMapping
    public Rating createRating(@RequestBody Rating rating) {
        return ratingService.createRating(rating);
    }

    // GET /ratings/menu/{menuItemId}
    @GetMapping("/menu/{menuItemId}")
    public List<Rating> getRatings(@PathVariable Integer menuItemId) {
        return ratingService.getRatingsByMenuItem(menuItemId);
    }

    // GET /ratings/menu/{menuItemId}/summary
    @GetMapping("/menu/{menuItemId}/summary")
    public RatingSummary getSummary(@PathVariable Integer menuItemId) {
        return ratingService.getRatingSummary(menuItemId);
    }
}