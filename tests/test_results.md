# Easy URL Shortener - Test Verification Reports

This report documents the verification of both the Spring Boot backend test suite and the React frontend test suite.

---

## 1. Backend Spring Boot Test Execution (JUnit 5)

Command: `.\mvnw test`

### Summary
- **Tests run**: 15
- **Failures**: 0
- **Errors**: 0
- **Skipped**: 0
- **Result**: `BUILD SUCCESS`

### Execution Console Log
```text
[INFO] Scanning for projects...
[INFO] 
[INFO] --------------------------< com.example:demo >--------------------------
[INFO] Building  0.0.1-SNAPSHOT
[INFO]   from pom.xml
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] --- resources:3.3.1:resources (default-resources) @ demo ---
[INFO] Copying 1 resource from src\main\resources to target\classes
[INFO] Copying 0 resource from src\main\resources to target\classes
[INFO] 
[INFO] --- compiler:3.13.0:compile (default-compile) @ demo ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- resources:3.3.1:testResources (default-testResources) @ demo ---
[INFO] skip non existing resourceDirectory C:\Users\acer\url-shortener\backend\src\test\resources
[INFO] 
[INFO] --- compiler:3.13.0:testCompile (default-testCompile) @ demo ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- surefire:3.2.5:test (default-test) @ demo ---
[INFO] Using auto detected provider org.apache.maven.surefire.junitplatform.JUnitPlatformProvider
[INFO] 
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.example.demo.DemoApplicationTests
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 4.071 s -- in com.example.demo.DemoApplicationTests
[INFO] Running com.example.demo.service.UrlServiceTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.240 s -- in com.example.demo.service.UrlServiceTest
[INFO] Running com.example.demo.controller.UrlControllerTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 2.110 s -- in com.example.demo.controller.UrlControllerTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 15, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  11.609 s
[INFO] Finished at: 2026-08-05T22:01:11+05:30
[INFO] ------------------------------------------------------------------------
```

---

## 2. Frontend React Test Execution (Jest & RTL)

Command: `npm test -- --watchAll=false`

### Summary
- **Test Suites**: 1 passed, 1 total
- **Tests**: 3 passed, 3 total
- **Result**: `PASS`

### Execution Console Log
```text
> url-shortener@0.1.0 test
> react-scripts test --watchAll=false

PASS src/App.test.tsx
  URL Shortener Frontend Tests
    ✓ renders homepage elements (269 ms)
    ✓ shows form validation error on empty URL (63 ms)
    ✓ shows form validation error on malformed URL (59 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        3.505 s
Ran all test suites.
```
