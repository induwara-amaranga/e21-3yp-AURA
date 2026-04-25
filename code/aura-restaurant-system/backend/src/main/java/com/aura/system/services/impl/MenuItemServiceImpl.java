package com.aura.system.services.impl;

import com.aura.service.ImageService;
import com.aura.system.entities.MenuItem;
import com.aura.system.mqtt.MqttGateway;
import com.aura.system.repositories.MenuItemRepository;
import com.aura.system.services.MenuItemService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class MenuItemServiceImpl implements MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final ImageService imageService;
    private final MqttGateway mqttGateway;
    private final ObjectMapper objectMapper;

    private static final String MENU_TOPIC = "aura/menu/updated";

    private void publishMenuUpdate(String action, MenuItem item) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("action", action);
            message.put("timestamp", System.currentTimeMillis());
            message.put("item", item);
            
            String json = objectMapper.writeValueAsString(message);
            mqttGateway.sendToMqtt(json, MENU_TOPIC);
            log.info("Published menu {} update for item: {}", action, item.getName());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize menu update message", e);
        }
    }

    @Override
    public List<MenuItem> getAllMenuItems() {
        return menuItemRepository.findAll();
    }

    @Override
    public MenuItem getMenuItemById(Integer id) {
        return menuItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu item not found with id: " + id));
    }

    @Override
    public List<MenuItem> getByCategory(String category) {
        return menuItemRepository.findByCategory(category);
    }

    @Override
    public List<MenuItem> getAvailableItems() {
        return menuItemRepository.findByAvailabilityTrue();
    }

    @Override
    public List<MenuItem> searchByName(String keyword) {
        return menuItemRepository.findByNameContainingIgnoreCase(keyword);
    }

    @Override
    public MenuItem createMenuItem(MenuItem menuItem, MultipartFile file) {
        if (file != null && !file.isEmpty()) {
            String imageUrl = imageService.uploadImage(file);
            menuItem.setImageUrl(imageUrl);
        }

        MenuItem saved = menuItemRepository.save(menuItem);
        publishMenuUpdate("created", saved);
        return saved;
    }

    @Override
    public MenuItem updateMenuItem(Integer id, MenuItem updated, MultipartFile file) {
        MenuItem existing = getMenuItemById(id);

        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setPrice(updated.getPrice());
        existing.setCategory(updated.getCategory());
        existing.setAvailability(updated.getAvailability());
        existing.setEmoji(updated.getEmoji());

        if (file != null && !file.isEmpty()) {
            String imageUrl = imageService.uploadImage(file);
            existing.setImageUrl(imageUrl);
        }

        MenuItem saved = menuItemRepository.save(existing);
        publishMenuUpdate("updated", saved);
        return saved;
    }

    @Override
    public MenuItem toggleAvailability(Integer id) {
        MenuItem existing = getMenuItemById(id);
        existing.setAvailability(!existing.getAvailability());
        MenuItem saved = menuItemRepository.save(existing);
        publishMenuUpdate("toggled", saved);
        return saved;
    }

    @Override
    public void deleteMenuItem(Integer id) {
        MenuItem item = getMenuItemById(id);
        menuItemRepository.deleteById(id);
        publishMenuUpdate("deleted", item);
    }
}