package com.example.demo.dto;

import java.time.LocalDateTime;

public class ClickEventDto {
    private LocalDateTime clickedAt;

    public ClickEventDto() {}

    public ClickEventDto(LocalDateTime clickedAt) {
        this.clickedAt = clickedAt;
    }

    public LocalDateTime getClickedAt() { return clickedAt; }
    public void setClickedAt(LocalDateTime clickedAt) { this.clickedAt = clickedAt; }
}
