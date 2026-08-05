package com.example.demo.dto;

import java.time.LocalDateTime;
import java.util.List;

public class UrlAnalyticsResponse {
    private Long id;
    private String originalUrl;
    private String shortCode;
    private LocalDateTime createdAt;
    private int clickCount;
    private LocalDateTime lastAccessedAt;
    private List<ClickEventDto> clickHistory;

    public UrlAnalyticsResponse() {}

    public UrlAnalyticsResponse(Long id, String originalUrl, String shortCode, LocalDateTime createdAt, int clickCount, LocalDateTime lastAccessedAt, List<ClickEventDto> clickHistory) {
        this.id = id;
        this.originalUrl = originalUrl;
        this.shortCode = shortCode;
        this.createdAt = createdAt;
        this.clickCount = clickCount;
        this.lastAccessedAt = lastAccessedAt;
        this.clickHistory = clickHistory;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOriginalUrl() { return originalUrl; }
    public void setOriginalUrl(String originalUrl) { this.originalUrl = originalUrl; }

    public String getShortCode() { return shortCode; }
    public void setShortCode(String shortCode) { this.shortCode = shortCode; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public int getClickCount() { return clickCount; }
    public void setClickCount(int clickCount) { this.clickCount = clickCount; }

    public LocalDateTime getLastAccessedAt() { return lastAccessedAt; }
    public void setLastAccessedAt(LocalDateTime lastAccessedAt) { this.lastAccessedAt = lastAccessedAt; }

    public List<ClickEventDto> getClickHistory() { return clickHistory; }
    public void setClickHistory(List<ClickEventDto> clickHistory) { this.clickHistory = clickHistory; }
}
