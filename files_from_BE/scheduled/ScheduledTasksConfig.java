package com.dental.clinic.management.scheduled;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Configuration to enable scheduled tasks (cron jobs).
 *
 * All scheduled jobs are located in the com.dental.clinic.management.scheduled
 * package.
 */
@Configuration
@EnableScheduling
public class ScheduledTasksConfig {
    // No additional configuration needed
    // @EnableScheduling activates the @Scheduled annotations
}
