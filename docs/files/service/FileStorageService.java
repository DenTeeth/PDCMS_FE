package com.dental.clinic.management.service;

import com.dental.clinic.management.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

/**
 * File Storage Service for Clinical Records Attachments
 *
 * Current Implementation: Local file storage
 * TODO: Migrate to S3/Cloud storage in production
 *
 * File organization:
 * - uploads/clinical-records/{recordId}/{timestamp}_{filename}
 */
@Slf4j
@Service
public class FileStorageService {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    // 10MB file size limit
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    // Allowed MIME types
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "application/pdf");

    /**
     * Store file to local filesystem
     *
     * @param file             MultipartFile from controller
     * @param clinicalRecordId Record ID for folder organization
     * @return Relative file path (e.g.,
     *         "uploads/clinical-records/1/20251202_143022_xray.jpg")
     */
    public String storeFile(MultipartFile file, Integer clinicalRecordId) throws IOException {
        log.info("Storing file for clinical record ID: {}", clinicalRecordId);

        // Step 1: Validate file
        validateFile(file);

        // Step 2: Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String uniqueFilename = timestamp + "_" + sanitizeFilename(originalFilename);

        // Step 3: Create directory structure
        Path recordDir = Paths.get(uploadDir, "clinical-records", String.valueOf(clinicalRecordId));
        Files.createDirectories(recordDir);

        // Step 4: Save file
        Path targetPath = recordDir.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        String relativePath = uploadDir + "/clinical-records/" + clinicalRecordId + "/" + uniqueFilename;
        log.info("File stored successfully: {}", relativePath);

        return relativePath;
    }

    /**
     * Delete file from filesystem
     *
     * @param filePath Relative path from database
     */
    public void deleteFile(String filePath) {
        try {
            Path path = Paths.get(filePath);
            Files.deleteIfExists(path);
            log.info("File deleted successfully: {}", filePath);
        } catch (IOException e) {
            log.error("Failed to delete file: {}", filePath, e);
            throw new RuntimeException("Failed to delete file: " + filePath, e);
        }
    }

    /**
     * Validate file size and type
     */
    public void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("EMPTY_FILE", "File is empty or null");
        }

        // Validate file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("FILE_TOO_LARGE",
                    String.format("File size exceeds maximum limit of %d MB", MAX_FILE_SIZE / (1024 * 1024)));
        }

        // Validate MIME type
        String mimeType = file.getContentType();
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType.toLowerCase())) {
            throw new BadRequestException("INVALID_FILE_TYPE",
                    "Invalid file type. Allowed types: JPEG, PNG, GIF, PDF");
        }

        log.debug("File validation passed: {} ({} bytes, {})", file.getOriginalFilename(), file.getSize(), mimeType);
    }

    /**
     * Sanitize filename to prevent path traversal attacks
     */
    private String sanitizeFilename(String filename) {
        if (filename == null) {
            return "unnamed_file";
        }

        // Remove path separators and special characters
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
