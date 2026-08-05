# Easy URL Shortener

A production-quality Full Stack URL Shortener application built with **React + TypeScript** on the frontend and **Java Spring Boot + H2 Database** on the backend.

---

## Project Overview

Easy URL Shortener allows users to:
- Paste a long URL and generate a unique shortened code (6-character alphanumeric)
- View a table of all recently shortened URLs with click counts
- Click the short URL to redirect to the original destination (click is tracked automatically)
- View per-URL analytics with a click frequency chart and raw event log
- Browse a statistics dashboard with bar chart (URL creations over time) and line chart (click activity over time)
- Delete URLs through a confirmation dialog
- Copy shortened URLs to clipboard

---

## Repository Structure

```
url-shortener/
├── frontend/               ← React + TypeScript frontend
│   ├── public/             ← Static HTML assets
│   ├── src/
│   │   ├── App.tsx         ← Main application with Home + Analytics pages
│   │   ├── App.test.tsx    ← Frontend unit tests (Jest + RTL)
│   │   └── services/
│   │       └── api.ts      ← Axios HTTP client service
│   ├── .env                ← API base URL environment variable
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                ← Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/example/demo/
│   │   │   │   ├── controller/UrlController.java
│   │   │   │   ├── service/UrlService.java
│   │   │   │   ├── repository/UrlRepository.java
│   │   │   │   ├── repository/ClickEventRepository.java
│   │   │   │   ├── entity/Url.java
│   │   │   │   ├── entity/ClickEvent.java
│   │   │   │   ├── dto/          ← UrlRequest, UrlResponse, UrlAnalyticsResponse, ClickEventDto
│   │   │   │   ├── exception/    ← UrlNotFoundException, InvalidUrlException, GlobalExceptionHandler
│   │   │   │   ├── config/CorsConfig.java
│   │   │   │   └── util/         ← ShortCodeGenerator, SeedDataRunner
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   │       └── java/com/example/demo/
│   │           ├── DemoApplicationTests.java
│   │           ├── service/UrlServiceTest.java
│   │           └── controller/UrlControllerTest.java
│   ├── pom.xml
│   └── mvnw.cmd            ← Maven wrapper (no Maven installation needed)
│
├── tests/
│   └── test_results.md     ← Console output of all test runs
│
└── README.md
```

---

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 19, TypeScript, React Router v6   |
| HTTP      | Axios                                   |
| Charts    | Custom responsive SVG charts            |
| Backend   | Java, Spring Boot 3.3.2, Spring Web     |
| Database  | H2 (in-memory), Spring Data JPA, Hibernate |
| Testing   | JUnit 5, MockMvc, Jest, React Testing Library |
| Build     | Maven Wrapper (mvnw.cmd), npm           |

---

## Prerequisites

Make sure the following are installed:

| Tool      | Version Required | Check Command       |
|-----------|-----------------|---------------------|
| Java (JDK)| 17 or higher    | `java -version`     |
| Node.js   | 16 or higher    | `node --version`    |
| npm       | 8 or higher     | `npm --version`     |

> **Note**: Maven does **not** need to be installed globally. The project includes `mvnw.cmd` (Maven Wrapper) which downloads Maven automatically.

---

## How to Run the Backend

Open a terminal and run the following commands:

```powershell
# Step 1: Navigate to the backend folder
cd C:\Users\acer\url-shortener\backend

# Step 2: Start the Spring Boot server using the Maven Wrapper
.\mvnw spring-boot:run
```

The backend API will be available at: **`http://localhost:8080`**

> First run may take 2–3 minutes to download Spring Boot dependencies from Maven Central.

### Verify Backend is Running
Open your browser and visit: [http://localhost:8080/api/urls](http://localhost:8080/api/urls)  
You should see a JSON response with the 10 pre-loaded seed URLs.

### H2 Database Console
To browse the database tables directly:
- URL: [http://localhost:8080/h2-console](http://localhost:8080/h2-console)
- **JDBC URL**: `jdbc:h2:mem:urlshortenerdb`
- **Username**: `sa`
- **Password**: *(leave blank)*

---

## How to Run the Frontend

Open a **new** terminal window and run:

```powershell
# Step 1: Navigate to the frontend folder
cd C:\Users\acer\url-shortener\frontend

# Step 2: Install dependencies (only needed first time)
npm install

# Step 3: Start the React development server
npm start
```

The application will open automatically in your browser at: **`http://localhost:3000`**

> Make sure the backend is running on port 8080 **before** starting the frontend, otherwise URL requests will fail.

---

## How to Load Seed Data

Seed data is **automatically loaded** on every backend startup via the `SeedDataRunner` class (`CommandLineRunner`).

On startup, **10 pre-configured URLs** are inserted with:
- Different original URLs (GitHub, Google, StackOverflow, React, Spring.io, etc.)
- Different creation dates (ranging from 10 days ago to today)
- Different click counts (0–18)
- Detailed click event histories (spaced over their respective active periods)

This ensures the statistics dashboard charts are populated with meaningful data immediately.

To **verify seed data was loaded**, open: [http://localhost:8080/api/urls](http://localhost:8080/api/urls)

---

## How to Run Tests

### Backend Tests (JUnit 5 + MockMvc)

```powershell
cd C:\Users\acer\url-shortener\backend
.\mvnw test
```

Expected output:
```
Tests run: 15, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

**Test coverage includes:**
- `DemoApplicationTests`: Application context loads correctly
- `UrlServiceTest` (7 tests): URL shortening logic, duplicate detection, validation (empty, malformed, unsupported protocol), redirect, 404 handling
- `UrlControllerTest` (7 tests): HTTP endpoint behavior, JSON response format, 302 redirect, error response structure

### Frontend Tests (Jest + React Testing Library)

```powershell
cd C:\Users\acer\url-shortener\frontend
npm test -- --watchAll=false
```

Expected output:
```
Tests:  3 passed, 3 total
PASS src/App.test.tsx
```

**Test coverage includes:**
- Homepage renders correctly (header, hero, input, button, URL table data)
- Form validation: empty URL shows error
- Form validation: malformed URL shows error

### View Test Results Report
Full test console output is saved in: [`tests/test_results.md`](tests/test_results.md)

---

## API Endpoints

| Method | Endpoint                    | Description                                      |
|--------|-----------------------------|--------------------------------------------------|
| POST   | `/api/urls`                 | Create a new shortened URL                       |
| GET    | `/api/urls`                 | Get paginated list of recent URLs (newest first) |
| GET    | `/api/urls/{id}/analytics`  | Get detailed analytics for a specific URL        |
| GET    | `/{shortCode}`              | Redirect to original URL + increment click count |
| DELETE | `/api/urls/{id}`            | Delete a shortened URL and its click history     |

### POST /api/urls — Request Body
```json
{
  "originalUrl": "https://example.com/very/long/path"
}
```

### POST /api/urls — Response (201 Created)
```json
{
  "id": 11,
  "originalUrl": "https://example.com/very/long/path",
  "shortCode": "AbCd12",
  "shortUrl": "http://localhost:8080/AbCd12",
  "createdAt": "2026-08-05T22:15:00",
  "clickCount": 0,
  "lastAccessedAt": null
}
```

---

## Assumptions & Trade-offs

| Decision | Approach Chosen | Rationale |
|----------|----------------|-----------|
| **Duplicate URL handling** | Returns existing short code | Reduces database bloat; centralizes click tracking |
| **Short code generation** | Random 6-char alphanumeric with 5-retry collision loop | `SecureRandom` ensures unpredictability |
| **Charts** | Custom SVG rendered from scratch | Avoids heavy Chart.js/Recharts bundle; fully responsive |
| **Database** | H2 in-memory | Requires no installation; data is reset on each restart (by design for demo use) |
| **Byte Buddy (Java 25)** | `net.bytebuddy.experimental=true` flag in Surefire | Required because JVM 25 exceeds what Mockito's bundled Byte Buddy version officially supports |
| **CORS** | Wildcard `*` origin | Simplified for development; restrict to specific origin in production |

---

## Future Improvements

- Persistent database (PostgreSQL/MySQL) for production use
- User authentication with JWT tokens
- QR code generation for each short URL
- Custom alias support (`/my-brand`)
- API rate limiting
- Dark mode toggle
- Export analytics as CSV
