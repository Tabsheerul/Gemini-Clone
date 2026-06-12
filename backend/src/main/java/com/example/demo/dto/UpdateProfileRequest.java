package com.example.demo.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String username;
    private String email;
}
