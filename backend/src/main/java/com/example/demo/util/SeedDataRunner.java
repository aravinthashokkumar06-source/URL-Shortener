package com.example.demo.util;

import com.example.demo.entity.ClickEvent;
import com.example.demo.entity.Url;
import com.example.demo.repository.ClickEventRepository;
import com.example.demo.repository.UrlRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class SeedDataRunner implements CommandLineRunner {

    private final UrlRepository urlRepository;
    private final ClickEventRepository clickEventRepository;

    public SeedDataRunner(UrlRepository urlRepository, ClickEventRepository clickEventRepository) {
        this.urlRepository = urlRepository;
        this.clickEventRepository = clickEventRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (urlRepository.count() > 0) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();

        // 1. GitHub (10 days ago, 8 clicks)
        Url url1 = new Url("https://github.com", "git101", now.minusDays(10));
        url1.setClickCount(8);
        url1.setLastAccessedAt(now.minusDays(1));
        urlRepository.save(url1);
        seedClicks(url1, 8, now.minusDays(10), now.minusDays(1));

        // 2. Google (8 days ago, 15 clicks)
        Url url2 = new Url("https://google.com", "goog02", now.minusDays(8));
        url2.setClickCount(15);
        url2.setLastAccessedAt(now.minusHours(4));
        urlRepository.save(url2);
        seedClicks(url2, 15, now.minusDays(8), now.minusHours(4));

        // 3. StackOverflow (7 days ago, 12 clicks)
        Url url3 = new Url("https://stackoverflow.com", "stov03", now.minusDays(7));
        url3.setClickCount(12);
        url3.setLastAccessedAt(now.minusDays(2));
        urlRepository.save(url3);
        seedClicks(url3, 12, now.minusDays(7), now.minusDays(2));

        // 4. Spring.io (6 days ago, 5 clicks)
        Url url4 = new Url("https://spring.io", "spri04", now.minusDays(6));
        url4.setClickCount(5);
        url4.setLastAccessedAt(now.minusDays(3));
        urlRepository.save(url4);
        seedClicks(url4, 5, now.minusDays(6), now.minusDays(3));

        // 5. React.dev (5 days ago, 10 clicks)
        Url url5 = new Url("https://react.dev", "reac05", now.minusDays(5));
        url5.setClickCount(10);
        url5.setLastAccessedAt(now.minusMinutes(45));
        urlRepository.save(url5);
        seedClicks(url5, 10, now.minusDays(5), now.minusMinutes(45));

        // 6. TypeScript (4 days ago, 6 clicks)
        Url url6 = new Url("https://typescriptlang.org", "type06", now.minusDays(4));
        url6.setClickCount(6);
        url6.setLastAccessedAt(now.minusDays(1));
        urlRepository.save(url6);
        seedClicks(url6, 6, now.minusDays(4), now.minusDays(1));

        // 7. Npmjs (3 days ago, 3 clicks)
        Url url7 = new Url("https://npmjs.com", "npmj07", now.minusDays(3));
        url7.setClickCount(3);
        url7.setLastAccessedAt(now.minusHours(12));
        urlRepository.save(url7);
        seedClicks(url7, 3, now.minusDays(3), now.minusHours(12));

        // 8. Wikipedia (2 days ago, 18 clicks)
        Url url8 = new Url("https://wikipedia.org", "wiki08", now.minusDays(2));
        url8.setClickCount(18);
        url8.setLastAccessedAt(now.minusHours(2));
        urlRepository.save(url8);
        seedClicks(url8, 18, now.minusDays(2), now.minusHours(2));

        // 9. HackerNews (1 day ago, 2 clicks)
        Url url9 = new Url("https://news.ycombinator.com", "hnws09", now.minusDays(1));
        url9.setClickCount(2);
        url9.setLastAccessedAt(now.minusMinutes(10));
        urlRepository.save(url9);
        seedClicks(url9, 2, now.minusDays(1), now.minusMinutes(10));

        // 10. W3Schools (today, 0 clicks)
        Url url10 = new Url("https://w3schools.com", "w3sc10", now);
        urlRepository.save(url10);
    }

    private void seedClicks(Url url, int count, LocalDateTime start, LocalDateTime end) {
        long durationMin = java.time.Duration.between(start, end).toMinutes();
        if (durationMin <= 0) {
            durationMin = 60;
        }
        long step = durationMin / Math.max(count, 1);
        for (int i = 0; i < count; i++) {
            LocalDateTime clickTime = start.plusMinutes(step * i);
            ClickEvent event = new ClickEvent(clickTime, url);
            clickEventRepository.save(event);
        }
    }
}
