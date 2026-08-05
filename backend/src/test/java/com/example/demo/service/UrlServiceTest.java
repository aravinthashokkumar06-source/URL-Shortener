package com.example.demo.service;

import com.example.demo.dto.UrlRequest;
import com.example.demo.dto.UrlResponse;
import com.example.demo.entity.Url;
import com.example.demo.exception.InvalidUrlException;
import com.example.demo.exception.UrlNotFoundException;
import com.example.demo.repository.ClickEventRepository;
import com.example.demo.repository.UrlRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UrlServiceTest {

    private UrlRepository urlRepository;
    private ClickEventRepository clickEventRepository;
    private UrlService urlService;

    @BeforeEach
    void setUp() {
        urlRepository = mock(UrlRepository.class);
        clickEventRepository = mock(ClickEventRepository.class);
        urlService = new UrlService(urlRepository, clickEventRepository);
    }

    @Test
    void shortenUrl_Success() {
        UrlRequest request = new UrlRequest("https://google.com");
        when(urlRepository.findByOriginalUrl("https://google.com")).thenReturn(Optional.empty());
        when(urlRepository.existsByShortCode(anyString())).thenReturn(false);
        when(urlRepository.save(any(Url.class))).thenAnswer(invocation -> {
            Url url = invocation.getArgument(0);
            url.setId(1L);
            return url;
        });

        UrlResponse response = urlService.shortenUrl(request);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("https://google.com", response.getOriginalUrl());
        assertEquals(6, response.getShortCode().length());
        verify(urlRepository, times(1)).save(any(Url.class));
    }

    @Test
    void shortenUrl_DuplicateOriginalUrl_ReturnsExisting() {
        UrlRequest request = new UrlRequest("https://google.com");
        Url existingUrl = new Url("https://google.com", "goog02", LocalDateTime.now());
        existingUrl.setId(2L);
        when(urlRepository.findByOriginalUrl("https://google.com")).thenReturn(Optional.of(existingUrl));

        UrlResponse response = urlService.shortenUrl(request);

        assertNotNull(response);
        assertEquals(2L, response.getId());
        assertEquals("goog02", response.getShortCode());
        verify(urlRepository, never()).save(any(Url.class));
    }

    @Test
    void shortenUrl_EmptyUrl_ThrowsInvalidUrlException() {
        UrlRequest request = new UrlRequest("");
        assertThrows(InvalidUrlException.class, () -> urlService.shortenUrl(request));
    }

    @Test
    void shortenUrl_MalformedUrl_ThrowsInvalidUrlException() {
        UrlRequest request = new UrlRequest("not_a_url");
        assertThrows(InvalidUrlException.class, () -> urlService.shortenUrl(request));
    }

    @Test
    void shortenUrl_UnsupportedProtocol_ThrowsInvalidUrlException() {
        UrlRequest request = new UrlRequest("ftp://google.com");
        assertThrows(InvalidUrlException.class, () -> urlService.shortenUrl(request));
    }

    @Test
    void resolveAndRedirect_Success() {
        Url url = new Url("https://google.com", "goog02", LocalDateTime.now());
        url.setId(1L);
        when(urlRepository.findByShortCode("goog02")).thenReturn(Optional.of(url));

        String redirectUrl = urlService.resolveAndRedirect("goog02");

        assertEquals("https://google.com", redirectUrl);
        assertEquals(1, url.getClickCount());
        assertNotNull(url.getLastAccessedAt());
        verify(urlRepository, times(1)).save(url);
        verify(clickEventRepository, times(1)).save(any());
    }

    @Test
    void resolveAndRedirect_NotFound_ThrowsUrlNotFoundException() {
        when(urlRepository.findByShortCode("missing")).thenReturn(Optional.empty());
        assertThrows(UrlNotFoundException.class, () -> urlService.resolveAndRedirect("missing"));
    }
}
