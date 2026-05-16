package com.example.iotmonitoring.user;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.regex.Pattern;

@Service
public class UserService {

    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{6,}$");
    private static final Pattern URL_PATTERN = Pattern.compile("^(https?|ftp)://[-a-zA-Z0-9+&@#/%?=~_|!:,.;]*[-a-zA-Z0-9+&@#/%=~_|]");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public ProfileResponse getProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found"));
        return new ProfileResponse(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(), user.getProfilePicture());
    }

    public MessageResponse changePassword(String currentPassword, String newPassword) {
        if (newPassword == null || !PASSWORD_PATTERN.matcher(newPassword).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password must be at least 6 characters and include uppercase, lowercase, numbers, and special characters");
        }
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid credentials"));
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password incorrect");
        }
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "new password cannot be the same as the current password");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return new MessageResponse("password updated");
    }

    public MessageResponse updatePicture(String pictureUrl) {
        if (pictureUrl == null || pictureUrl.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "picture URL is required");
        }
        if (!URL_PATTERN.matcher(pictureUrl).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid URL format");
        }
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found"));
        user.setProfilePicture(pictureUrl);
        userRepository.save(user);
        return new MessageResponse("picture updated");
    }

    public record ProfileResponse(String id, String email, String firstName, String lastName, String profilePicture) {}
    public record MessageResponse(String message) {}
}
