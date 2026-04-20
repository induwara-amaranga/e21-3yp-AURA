package com.aura.system.repositories;

import com.aura.system.entities.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Integer> {

    // All reservations for a specific table
    List<Reservation> findByTableTableId(Integer tableId);

    // All active (non-cancelled) reservations
    List<Reservation> findByStatusNot(String status);

    // Check for overlapping reservations on the same table
    // (within a 2-hour window either side of requested time)
    @Query("SELECT r FROM Reservation r " +
           "WHERE r.table.tableId = :tableId " +
           "AND r.status = 'CONFIRMED' " +
           "AND r.reservationTime BETWEEN :windowStart AND :windowEnd")
    List<Reservation> findConflictingReservations(
            @Param("tableId") Integer tableId,
            @Param("windowStart") LocalDateTime windowStart,
            @Param("windowEnd") LocalDateTime windowEnd);
}