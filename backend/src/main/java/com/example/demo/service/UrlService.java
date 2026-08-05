package com.example.demo.service;

import com.example.demo.dto.ClickEventDto;
import com.example.demo.dto.UrlAnalyticsResponse;
import com.example.demo.dto.UrlRequest;
import com.example.demo.dto.UrlResponse;
import com.example.demo.entity.ClickEvent;
import com.example.demo.entity.Url;
import com.example.demo.exception.InvalidUrlException;
import com.example.demo.exception.UrlNotFoundException;
import com.example.demo.repository.ClickEventRepository;
import com.example.demo.repository.UrlRepository;
import com.example.demo.util.ShortCodeGenerator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.MalformedURLException;
import java.net.URL;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UrlService {

    private final UrlRepository urlRepository;
    private final ClickEventRepository clickEventRepository;

    @Value("${app.short-url-prefix:http://localhost:8080/}")
    private String shortUrlPrefix;

    public UrlService(UrlRepository urlRepository, ClickEventRepository clickEventRepository) {
        this.urlRepository = urlRepository;
        this.clickEventRepository = clickEventRepository;
    }

    private void validateUrl(String originalUrl) {
        if (originalUrl == null || originalUrl.trim().isEmpty()) {
            throw new InvalidUrlException("URL cannot be empty.");
        }
        try {
            URL url = new URL(originalUrl);
            String protocol = url.getProtocol();
            if (!"http".equalsIgnoreCase(protocol) && !"https".equalsIgnoreCase(protocol)) {
                throw new InvalidUrlException("URL must use HTTP or HTTPS protocol.");
            }
        } catch (MalformedURLException e) {
            throw new InvalidUrlException("Invalid URL structure.");
        }
    }

    @Transactional
    public UrlResponse shortenUrl(UrlRequest request) {
        String originalUrl = request.getOriginalUrl().trim();
        validateUrl(originalUrl);

        // Check if original URL already shortened
        Optional<Url> existing = urlRepository.findByOriginalUrl(originalUrl);
        if (existing.isPresent()) {
            return mapToResponse(existing.get());
        }

        // Generate short code with retry logic on collision
        String shortCode = null;
        int retries = 0;
        while (retries < 5) {
            String tempCode = ShortCodeGenerator.generate();
            if (!urlRepository.existsByShortCode(tempCode)) {
                shortCode = tempCode;
                break;
            }
            retries++;
        }

        if (shortCode == null) {
            throw new RuntimeException("Unable to generate unique short code. Please try again.");
        }

        Url url = new Url(originalUrl, shortCode, LocalDateTime.now());
        Url saved = urlRepository.save(url);
        return mapToResponse(saved);
    }

    public Page<UrlResponse> getRecentUrls(Pageable pageable) {
        return urlRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Transactional
    public String resolveAndRedirect(String shortCode) {
        Url url = urlRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new UrlNotFoundException("Short URL code not found: " + shortCode));

        // Increment clicks
        url.setClickCount(url.getClickCount() + 1);
        url.setLastAccessedAt(LocalDateTime.now());
        urlRepository.save(url);

        // Register ClickEvent
        ClickEvent clickEvent = new ClickEvent(LocalDateTime.now(), url);
        clickEventRepository.save(clickEvent);

        return url.getOriginalUrl();
    }

    public UrlAnalyticsResponse getAnalytics(Long id) {
        Url url = urlRepository.findById(id)
                .orElseThrow(() -> new UrlNotFoundException("URL with ID " + id + " not found."));

        List<ClickEventDto> history = clickEventRepository.findByUrlIdOrderByClickedAtAsc(id).stream()
                .map(event -> new ClickEventDto(event.getClickedAt()))
                .collect(Collectors.toList());

        return new UrlAnalyticsResponse(
                url.getId(),
                url.getOriginalUrl(),
                url.getShortCode(),
                url.getCreatedAt(),
                url.getClickCount(),
                url.getLastAccessedAt(),
                history
        );
    }

    @Transactional
    public void deleteUrl(Long id) {
        if (!urlRepository.existsById(id)) {
            throw new UrlNotFoundException("URL with ID " + id + " not found.");
        }
        urlRepository.deleteById(id);
    }

    private UrlResponse mapToResponse(Url url) {
        return new UrlResponse(
                url.getId(),
                url.getOriginalUrl(),
                url.getShortCode(),
                shortUrlPrefix + url.getShortCode(),
                url.getCreatedAt(),
                url.getClickCount(),
                url.getLastAccessedAt()
        );
    }
}
