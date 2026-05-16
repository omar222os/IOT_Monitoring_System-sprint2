package com.example.iotmonitoring.user;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserService.ProfileResponse> me() {
        return ResponseEntity.ok(userService.getProfile());
    }

    @PatchMapping("/password")
    public ResponseEntity<UserService.MessageResponse> changePassword(@RequestBody ChangePasswordRequest req) {
        if (req == null || req.currentPassword() == null || req.newPassword() == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(userService.changePassword(req.currentPassword(), req.newPassword()));
    }

    @PatchMapping("/picture")
    public ResponseEntity<UserService.MessageResponse> updatePicture(@RequestBody UpdatePictureRequest req) {
        if (req == null || req.pictureUrl() == null || req.pictureUrl().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(userService.updatePicture(req.pictureUrl()));
    }
}

record ChangePasswordRequest(String currentPassword, String newPassword) {}
record UpdatePictureRequest(String pictureUrl) {}
