package com.example.iotmonitoring.auth_endpoints;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final boolean cookieSecure;

    public AuthController(AuthService authService, @Value("${cookie.secure:false}") boolean cookieSecure) {
        this.authService = authService;
        this.cookieSecure = cookieSecure;
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthService.SignupResponse> signup(@RequestBody SignupRequest req) {
        if (req == null
                || req.email() == null || req.email().isBlank()
                || req.password() == null || req.password().isBlank()
                || req.firstName() == null || req.firstName().isBlank()
                || req.lastName() == null || req.lastName().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        AuthService.SignupResponse body = authService.signup(req.email(), req.password(), req.firstName(), req.lastName(), req.profilePicture());
        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE, buildCookie(body.token()).toString())
                .body(body);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthService.LoginResponse> login(@RequestBody LoginRequest req) {
        if (req == null
                || req.email() == null || req.email().isBlank()
                || req.password() == null || req.password().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        AuthService.LoginResponse body = authService.login(req.email(), req.password());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildCookie(body.token()).toString())
                .body(body);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie().toString())
                .build();
    }

    private ResponseCookie buildCookie(String token) {
        return ResponseCookie.from("token", token)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(60 * 60 * 24)
                .sameSite("Lax")
                .build();
    }

    private ResponseCookie clearCookie() {
        return ResponseCookie.from("token", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
    }
}

record SignupRequest(String email, String password, String firstName, String lastName, String profilePicture) {}
record LoginRequest(String email, String password) {}
