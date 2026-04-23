package com.aura.system.services;

import com.aura.system.entities.MenuItem;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface MenuItemService {

    List<MenuItem> getAllMenuItems();

    MenuItem getMenuItemById(Integer id);

    List<MenuItem> getByCategory(String category);

    List<MenuItem> getAvailableItems();

    List<MenuItem> searchByName(String keyword);

    MenuItem createMenuItem(MenuItem menuItem, MultipartFile file);

    MenuItem updateMenuItem(Integer id, MenuItem menuItem, MultipartFile file);

    MenuItem toggleAvailability(Integer id);

    void deleteMenuItem(Integer id);
}