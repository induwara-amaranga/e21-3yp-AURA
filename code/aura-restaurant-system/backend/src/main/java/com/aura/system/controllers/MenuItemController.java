package com.aura.system.controllers;

import com.aura.system.entities.MenuItem;
import com.aura.system.services.MenuItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuItemController {

    private final MenuItemService menuItemService;

    @GetMapping
    public ResponseEntity<List<MenuItem>> getAllMenuItems() {
        return ResponseEntity.ok(menuItemService.getAllMenuItems());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MenuItem> getMenuItemById(@PathVariable Integer id) {
        return ResponseEntity.ok(menuItemService.getMenuItemById(id));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<MenuItem>> getByCategory(@PathVariable String category) {
        return ResponseEntity.ok(menuItemService.getByCategory(category));
    }

    @GetMapping("/available")
    public ResponseEntity<List<MenuItem>> getAvailableItems() {
        return ResponseEntity.ok(menuItemService.getAvailableItems());
    }

    @GetMapping("/search")
    public ResponseEntity<List<MenuItem>> searchByName(@RequestParam String keyword) {
        return ResponseEntity.ok(menuItemService.searchByName(keyword));
    }

    /**
     * Create menu item with optional image upload.
     * Use form-data in Postman/frontend.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MenuItem> createMenuItem(
            @ModelAttribute MenuItem menuItem,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(menuItemService.createMenuItem(menuItem, file));
    }

    /**
     * Update menu item with optional new image upload.
     * If no file is sent, old image remains unchanged.
     */
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MenuItem> updateMenuItem(
            @PathVariable Integer id,
            @ModelAttribute MenuItem menuItem,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        return ResponseEntity.ok(menuItemService.updateMenuItem(id, menuItem, file));
    }

    @PatchMapping("/{id}/availability")
    public ResponseEntity<MenuItem> toggleAvailability(@PathVariable Integer id) {
        return ResponseEntity.ok(menuItemService.toggleAvailability(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteMenuItem(@PathVariable Integer id) {
        menuItemService.deleteMenuItem(id);
        return ResponseEntity.ok("Menu item deleted successfully");
    }
}