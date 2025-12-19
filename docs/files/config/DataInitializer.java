package com.dental.clinic.management.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

/**
 * Data Initializer - Loads seed data AFTER Hibernate creates tables
 *
 * EXECUTION ORDER:
 * 1. spring.sql.init runs dental-clinic-seed-data.sql (creates ENUMs only, with
 * continue-on-error=true)
 * 2. Hibernate creates all tables from Entity classes (ddl-auto: update)
 * 3. This PostConstruct bean loads INSERT statements from same SQL file
 *
 * NOTE: This is part of the dental-clinic-seed-data.sql strategy.
 * No additional SQL files are created - we parse the same file and skip CREATE
 * TYPE statements.
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    @Autowired
    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void initData() {
        try {
            log.info("Starting seed data initialization...");

            // Check if data already exists in multiple tables (avoid duplicate inserts)
            Integer roleCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM roles WHERE role_id = 'ROLE_ADMIN'",
                    Integer.class);
            Integer itemCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM item_masters",
                    Integer.class);
            Integer serviceCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM services",
                    Integer.class);

            // API 6.17: Check service_consumables separately (may need reload)
            Integer consumablesCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM service_consumables",
                    Integer.class);

            // Log counts for debugging
            log.info("Data counts: roles={}, items={}, services={}, consumables={}",
                    roleCount, itemCount, serviceCount, consumablesCount);

            // If ALL tables have data, skip initialization
            if (roleCount != null && roleCount > 0 &&
                    itemCount != null && itemCount > 0 &&
                    serviceCount != null && serviceCount > 0 &&
                    consumablesCount != null && consumablesCount > 0) {
                log.info(
                        "Seed data already exists (roles: {}, items: {}, services: {}, consumables: {}), skipping initialization",
                        roleCount, itemCount, serviceCount, consumablesCount);
                return;
            }

            // If ANY critical table is empty, reload ALL data
            if (serviceCount != null && serviceCount == 0) {
                log.warn("Services table is empty - will reload ALL seed data");
            }

            if (consumablesCount != null && consumablesCount == 0) {
                log.warn("Service consumables table is empty - will reload ALL seed data for API 6.17");
            }

            if (roleCount != null && roleCount > 0 && (serviceCount == 0 || itemCount == 0)) {
                log.info("Partial seed data detected - will attempt to load missing data...");
            }

            // Read seed data file
            ClassPathResource resource = new ClassPathResource("db/dental-clinic-seed-data.sql");
            String sqlContent;

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                sqlContent = reader.lines().collect(Collectors.joining("\n"));
            }

            // Filter out CREATE TYPE statements, keep only INSERT/UPDATE/DELETE
            // Remove all CREATE TYPE blocks (they're already executed by spring.sql.init)
            String insertOnlyContent = sqlContent.replaceAll("(?i)CREATE\\s+TYPE[^;]+;", "");

            // Remove comment blocks while preserving newlines to avoid breaking multi-line
            // statements
            insertOnlyContent = insertOnlyContent.replaceAll("--[^\n]*\n", "\n");

            // Execute the filtered SQL content as a single script
            int executedCount = 0;
            int skippedCount = 0;

            try {
                // Split by semicolon but preserve multi-line statements
                String[] statements = insertOnlyContent.split(";");

                for (String statement : statements) {
                    String trimmed = statement.trim();

                    // Skip empty statements
                    if (trimmed.isEmpty() || trimmed.length() < 10) {
                        continue;
                    }

                    // Execute DML statements (INSERT, UPDATE, DELETE, SELECT) and constraint fixes (ALTER TABLE)
                    String upperStatement = trimmed.toUpperCase();
                    if (upperStatement.startsWith("INSERT") ||
                            upperStatement.startsWith("UPDATE") ||
                            upperStatement.startsWith("DELETE") ||
                            upperStatement.startsWith("SELECT") ||
                            upperStatement.startsWith("ALTER SEQUENCE") ||
                            upperStatement.startsWith("ALTER TABLE")) {

                        try {
                            jdbcTemplate.execute(trimmed);
                            executedCount++;

                            // Log first few inserts and service_consumables for verification
                            if (executedCount <= 5 || trimmed.toUpperCase().contains("SERVICE_CONSUMABLES")) {
                                log.debug("Executed: {}", trimmed.substring(0, Math.min(150, trimmed.length())));
                            }
                        } catch (Exception e) {
                            // Log but continue (some statements might fail due to FK constraints - that's
                            // OK)
                            // Log service_consumables failures for debugging API 6.17
                            if (executedCount < 10 || trimmed.toUpperCase().contains("SERVICE_CONSUMABLES")) {
                                log.warn("Failed statement: {}", trimmed.substring(0, Math.min(150, trimmed.length())));
                                log.warn("Error: {}", e.getMessage());
                                log.warn("Root cause: {}",
                                        e.getCause() != null ? e.getCause().getMessage() : "No cause");
                            }
                            skippedCount++;
                        }
                    } else {
                        skippedCount++;
                    }
                }
            } catch (Exception e) {
                log.error("Error processing SQL content", e);
            }

            log.info("Seed data initialization completed: {} statements executed, {} skipped",
                    executedCount, skippedCount);

        } catch (Exception e) {
            log.error("Failed to initialize seed data", e);
            // Don't throw exception - allow server to start even if seed data fails
        }
    }
}
