package com.aura.system.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Integer orderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id", nullable = false)
    private RestaurantTable table;

    @Column(name = "order_time", nullable = false)
    private LocalDateTime orderTime;           // ← ADD THIS

    @Column(name = "delivered_at")             // ← removed nullable = false
    private LocalDateTime deliveredAt;

    @Column(name = "status")
    private String status;

    @Column(name = "total_amount")
    private Float totalAmount;
}