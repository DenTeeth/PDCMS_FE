package com.dental.clinic.management.warehouse.repository;

import com.dental.clinic.management.warehouse.domain.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    Optional<Supplier> findBySupplierCode(String supplierCode);

    List<Supplier> findByIsActiveTrue();

    @Query("SELECT MAX(s.supplierId) FROM Supplier s")
    Long findMaxSupplierId();

    // 🔍 Pagination + Search Query
    @Query("SELECT s FROM Supplier s WHERE " +
            "(:search IS NULL OR :search = '' OR " +
            "LOWER(s.supplierName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(s.supplierCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "s.phoneNumber LIKE CONCAT('%', :search, '%') OR " +
            "LOWER(s.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Supplier> findAllWithSearch(@Param("search") String search, Pageable pageable);

    // Validation queries
    boolean existsBySupplierNameIgnoreCase(String supplierName);

    boolean existsByPhoneNumber(String phoneNumber);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByAddressIgnoreCase(String address);

    // Validation queries excluding current supplier (for update)
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM Supplier s " +
            "WHERE LOWER(s.supplierName) = LOWER(:supplierName) AND s.supplierId != :supplierId")
    boolean existsBySupplierNameIgnoreCaseAndIdNot(@Param("supplierName") String supplierName,
            @Param("supplierId") Long supplierId);

    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM Supplier s " +
            "WHERE s.phoneNumber = :phoneNumber AND s.supplierId != :supplierId")
    boolean existsByPhoneNumberAndIdNot(@Param("phoneNumber") String phoneNumber,
            @Param("supplierId") Long supplierId);

    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM Supplier s " +
            "WHERE LOWER(s.email) = LOWER(:email) AND s.supplierId != :supplierId")
    boolean existsByEmailIgnoreCaseAndIdNot(@Param("email") String email,
            @Param("supplierId") Long supplierId);
}
