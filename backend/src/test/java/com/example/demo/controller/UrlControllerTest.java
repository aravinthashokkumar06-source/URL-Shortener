package com.example.demo.controller;

import com.example.demo.dto.UrlAnalyticsResponse;
import com.example.demo.dto.UrlRequest;
import com.example.demo.dto.UrlResponse;
import com.example.demo.exception.InvalidUrlException;
import com.example.demo.exception.UrlNotFoundException;
import com.example.demo.service.UrlService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UrlController.class)
class UrlControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UrlService urlService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shortenUrl_Success() throws Exception {
        UrlRequest request = new UrlRequest("https://google.com");
        UrlResponse response = new UrlResponse(1L, "https://google.com", "goog02", "http://localhost:8080/goog02", LocalDateTime.now(), 0, null);

        when(urlService.shortenUrl(any(UrlRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/urls")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.originalUrl").value("https://google.com"))
                .andExpect(jsonPath("$.shortCode").value("goog02"))
                .andExpect(jsonPath("$.shortUrl").value("http://localhost:8080/goog02"));
    }

    @Test
    void shortenUrl_InvalidUrl_Returns400() throws Exception {
        UrlRequest request = new UrlRequest("invalid_url");
        when(urlService.shortenUrl(any(UrlRequest.class))).thenThrow(new InvalidUrlException("Invalid URL structure."));

        mockMvc.perform(post("/api/urls")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Invalid URL structure."));
    }

    @Test
    void redirectToOriginal_Success() throws Exception {
        when(urlService.resolveAndRedirect("goog02")).thenReturn("https://google.com");

        mockMvc.perform(get("/goog02"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "https://google.com"));
    }

    @Test
    void redirectToOriginal_NotFound_Returns404() throws Exception {
        when(urlService.resolveAndRedirect("missing")).thenThrow(new UrlNotFoundException("Short URL code not found: missing"));

        mockMvc.perform(get("/missing"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Short URL code not found: missing"));
    }

    @Test
    void getRecentUrls_Success() throws Exception {
        UrlResponse response = new UrlResponse(1L, "https://google.com", "goog02", "http://localhost:8080/goog02", LocalDateTime.now(), 0, null);
        Page<UrlResponse> page = new PageImpl<>(Collections.singletonList(response));

        when(urlService.getRecentUrls(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/urls")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].originalUrl").value("https://google.com"));
    }

    @Test
    void getAnalytics_Success() throws Exception {
        UrlAnalyticsResponse analytics = new UrlAnalyticsResponse(1L, "https://google.com", "goog02", LocalDateTime.now(), 5, LocalDateTime.now(), Collections.emptyList());

        when(urlService.getAnalytics(1L)).thenReturn(analytics);

        mockMvc.perform(get("/api/urls/1/analytics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.originalUrl").value("https://google.com"))
                .andExpect(jsonPath("$.clickCount").value(5));
    }

    @Test
    void deleteUrl_Success() throws Exception {
        doNothing().when(urlService).deleteUrl(1L);

        mockMvc.perform(delete("/api/urls/1"))
                .andExpect(status().isNoContent());

        verify(urlService, times(1)).deleteUrl(1L);
    }
}
