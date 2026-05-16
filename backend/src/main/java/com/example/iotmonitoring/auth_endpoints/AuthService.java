package com.example.iotmonitoring.auth_endpoints;

import com.example.iotmonitoring.auth.JwtService;
import com.example.iotmonitoring.user.User;
import com.example.iotmonitoring.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.regex.Pattern;

@Service
public class AuthService {

    public record SignupResponse(String id, String email, String firstName, String lastName, String profilePicture, String token) {}
    public record LoginResponse(String token) {}

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{6,}$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public SignupResponse signup(String email, String password, String firstName, String lastName, String profilePicture) {
        if (email == null || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid email");
        }
        if (password == null || !PASSWORD_PATTERN.matcher(password).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password must be at least 6 characters and include uppercase, lowercase, numbers, and special characters");
        }
        if (firstName == null || firstName.isBlank() || firstName.length() > 30) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "first name is required and must be 30 chars or less");
        }
        if (lastName == null || lastName.isBlank() || lastName.length() > 30) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "last name is required and must be 30 chars or less");
        }

        if (profilePicture != null && !profilePicture.isBlank() && !isValidUrl(profilePicture)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "profile picture must be a valid URL");
        }
        if (userRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "email already registered");
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setProfilePicture(profilePicture);
        userRepository.save(user);

        String token = jwtService.generateToken(user.getEmail(), user.getId());

        return new SignupResponse(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(), user.getProfilePicture(), token);
    }

    public LoginResponse login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid credentials"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid credentials");
        }

        String token = jwtService.generateToken(user.getEmail(), user.getId());
        return new LoginResponse(token);
    }

    private boolean isValidUrl(String s) {
        try {
            URI uri = new URI(s);
            String scheme = uri.getScheme();
            return uri.isAbsolute() && scheme != null
                    && (scheme.equals("http") || scheme.equals("https"))
                    && uri.getHost() != null;
        } catch (URISyntaxException e) {
            return false;
        }
    }
}
