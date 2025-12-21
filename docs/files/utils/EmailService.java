package com.dental.clinic.management.utils;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Send email verification link to new user
     */
    @Async
    public void sendVerificationEmail(String toEmail, String username, String token) {
        try {
            String verificationUrl = frontendUrl + "/verify-email?token=" + token;

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Xác thực tài khoản - Phòng khám nha khoa");

            String htmlContent = String.format(
                    """
                            <html>
                            <body style="font-family: Arial, sans-serif;">
                                <h2>Xin chào %s,</h2>
                                <p>Cảm ơn bạn đã đăng ký tài khoản tại Phòng khám nha khoa của chúng tôi.</p>
                                <p>Vui lòng nhấn vào link bên dưới để xác thực email của bạn:</p>
                                <p><a href="%s" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Xác thực email</a></p>
                                <p>Hoặc copy link sau vào trình duyệt:</p>
                                <p>%s</p>
                                <p><strong>Lưu ý:</strong> Link này sẽ hết hạn sau 24 giờ.</p>
                                <p>Nếu bạn không yêu cầu đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
                                <br>
                                <p>Trân trọng,</p>
                                <p>Đội ngũ Phòng khám nha khoa</p>
                            </body>
                            </html>
                            """,
                    username, verificationUrl, verificationUrl);

            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info(" Verification email sent to: {}", toEmail);

        } catch (MessagingException e) {
            logger.error(" Failed to send verification email to {}: {}", toEmail, e.getMessage());
        }
    }

    /**
     * Send password reset link to user
     */
    @Async
    public void sendPasswordResetEmail(String toEmail, String username, String token) {
        try {
            String resetUrl = frontendUrl + "/reset-password?token=" + token;

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Đặt lại mật khẩu - Phòng khám nha khoa");

            String htmlContent = String.format(
                    """
                            <html>
                            <body style="font-family: Arial, sans-serif;">
                                <h2>Xin chào %s,</h2>
                                <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                                <p>Vui lòng nhấn vào link bên dưới để đặt lại mật khẩu:</p>
                                <p><a href="%s" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Đặt lại mật khẩu</a></p>
                                <p>Hoặc copy link sau vào trình duyệt:</p>
                                <p>%s</p>
                                <p><strong>Lưu ý:</strong> Link này sẽ hết hạn sau 24 giờ và chỉ sử dụng được 1 lần.</p>
                                <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.</p>
                                <br>
                                <p>Trân trọng,</p>
                                <p>Đội ngũ Phòng khám nha khoa</p>
                            </body>
                            </html>
                            """,
                    username, resetUrl, resetUrl);

            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info(" Password reset email sent to: {}", toEmail);

        } catch (MessagingException e) {
            logger.error(" Failed to send password reset email to {}: {}", toEmail, e.getMessage());
        }
    }

    /**
     * Send welcome email to new patient with password setup link
     * This is for newly created patients who need to set their password for the
     * first time
     * Uses the same reset-password flow as forgot password
     */
    @Async
    public void sendWelcomeEmailWithPasswordSetup(String toEmail, String patientName, String token) {
        try {
            String setupPasswordUrl = frontendUrl + "/reset-password?token=" + token;

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Chào mừng đến với Phòng khám nha khoa - Thiết lập mật khẩu");

            String htmlContent = String.format(
                    """
                            <html>
                            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                                <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                                    <div style="background-color: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                                        <h2 style="color: #2196F3; margin-bottom: 20px;">Chào mừng đến với Phòng khám nha khoa DenTeeth!</h2>
                                        <p>Xin chào <strong>%s</strong>,</p>
                                        <p>Hồ sơ bệnh nhân của bạn đã được tạo thành công tại phòng khám của chúng tôi.</p>
                                        <p>Để hoàn tất quá trình đăng ký và có thể truy cập hệ thống, vui lòng nhấn vào nút bên dưới để thiết lập mật khẩu cho tài khoản của bạn:</p>

                                        <div style="text-align: center; margin: 30px 0;">
                                            <a href="%s" style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                                Thiết lập mật khẩu
                                            </a>
                                        </div>

                                        <p style="color: #666; font-size: 14px;">Hoặc copy link sau vào trình duyệt:</p>
                                        <p style="background-color: #f5f5f5; padding: 10px; border-left: 4px solid #2196F3; word-break: break-all; font-size: 12px;">%s</p>

                                        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                                            <p style="margin: 0; color: #856404;"><strong>Lưu ý quan trọng:</strong></p>
                                            <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
                                                <li>Link này sẽ hết hạn sau <strong>24 giờ</strong></li>
                                                <li>Mật khẩu của bạn cần có ít nhất 8 ký tự</li>
                                                <li>Nên sử dụng kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</li>
                                            </ul>
                                        </div>

                                        <p>Sau khi thiết lập mật khẩu, bạn có thể:</p>
                                        <ul style="color: #666;">
                                            <li>Xem lịch sử khám bệnh</li>
                                            <li>Đặt lịch hẹn online</li>
                                            <li>Xem kế hoạch điều trị</li>
                                            <li>Cập nhật thông tin cá nhân</li>
                                        </ul>

                                        <p style="margin-top: 30px;">Nếu bạn không yêu cầu đăng ký tài khoản này, vui lòng liên hệ với chúng tôi ngay.</p>

                                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

                                        <p style="color: #666; font-size: 14px; margin-bottom: 0;">Trân trọng,</p>
                                        <p style="color: #2196F3; font-weight: bold; margin-top: 5px;">Đội ngũ Phòng khám nha khoa DenTeeth</p>
                                    </div>
                                    <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
                                        © 2025 Phòng khám nha khoa DenTeeth. All rights reserved.
                                    </p>
                                </div>
                            </body>
                            </html>
                            """,
                    patientName, setupPasswordUrl, setupPasswordUrl);

            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info(" Welcome email with password setup sent to: {}", toEmail);

        } catch (MessagingException e) {
            logger.error(" Failed to send welcome email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send welcome email", e);
        }
    }

    /**
     * Send warehouse expiry alert email
     * Daily digest format with color-coded urgency sections
     */
    @Async
    public void sendExpiryAlertEmail(
            String toEmail,
            String username,
            String htmlContent,
            int criticalCount,
            int warningCount,
            int infoCount) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);

            // Subject line with counts for quick overview
            String subject = String.format("Bao cao vat tu het han - KHAN: %d | CANH BAO: %d | THONG BAO: %d",
                    criticalCount, warningCount, infoCount);
            helper.setSubject(subject);

            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info("Expiry alert email sent to: {} (CRITICAL: {}, WARNING: {}, INFO: {})",
                    toEmail, criticalCount, warningCount, infoCount);

        } catch (MessagingException e) {
            logger.error("Failed to send expiry alert email to {}: {}", toEmail, e.getMessage());
        }
    }

    /**
     * Send simple text email (fallback method)
     */
    @Async
    public void sendSimpleEmail(String toEmail, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(text);

            mailSender.send(message);
            logger.info(" Simple email sent to: {}", toEmail);

        } catch (Exception e) {
            logger.error(" Failed to send simple email to {}: {}", toEmail, e.getMessage());
        }
    }
}
