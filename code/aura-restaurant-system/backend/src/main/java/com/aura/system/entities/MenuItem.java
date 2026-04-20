package com.aura.system.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "menu_item")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "menu_item_id")
    private Integer menuItemId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "price", nullable = false)
    private Float price;

    @Column(name = "category")
    private String category;

    @Column(name = "availability", nullable = false)
    private Boolean availability;

    // 🔹 New fields

    // @Column(name = "rating")
    // private Float rating; // e.g., 4.5

    @Column(name = "image_url")
    private String imageUrl; // link to image

    @Column(name = "emoji", length = 10)
    private String emoji; // e.g., 🍕🍔
}