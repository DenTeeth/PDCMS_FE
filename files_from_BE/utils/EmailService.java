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
            logger.info("✅ Verification email sent to: {}", toEmail);

        } catch (MessagingException e) {
            logger.error("❌ Failed to send verification email to {}: {}", toEmail, e.getMessage());
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
                                <p><strong>Lưu ý:</strong> Link này sẽ hết hạn sau 1 giờ và chỉ sử dụng được 1 lần.</p>
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
            logger.info("✅ Password reset email sent to: {}", toEmail);

        } catch (MessagingException e) {
            logger.error("❌ Failed to send password reset email to {}: {}", toEmail, e.getMessage());
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
            logger.info("✅ Simple email sent to: {}", toEmail);

        } catch (Exception e) {
            logger.error("❌ Failed to send simple email to {}: {}", toEmail, e.getMessage());
        }
    }
}
