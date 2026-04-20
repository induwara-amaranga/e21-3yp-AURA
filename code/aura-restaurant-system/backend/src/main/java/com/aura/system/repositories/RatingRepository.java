package com.aura.system.repositories;

import com.aura.system.entities.Rating;
import com.aura.system.entities.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RatingRepository extends JpaRepository<Rating, Long> {

    // Get all ratings for a menu item
    List<Rating> findByMenuItem(MenuItem menuItem);

    // Or simpler version using id
    List<Rating> findByMenuItem_MenuItemId(Integer menuItemId);

    // Average rating for a menu item
    @Query("SELECT AVG(r.score) FROM Rating r WHERE r.menuItem.menuItemId = :menuItemId")
    Double getAverageRating(@Param("menuItemId") Integer menuItemId);

    // Count ratings for a menu item
    @Query("SELECT COUNT(r) FROM Rating r WHERE r.menuItem.menuItemId = :menuItemId")
    Long countByMenuItemId(@Param("menuItemId") Integer menuItemId);
}