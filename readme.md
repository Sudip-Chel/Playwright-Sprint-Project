# ParaBank E2E Automation Framework

Enterprise-grade QA Automation framework built using Playwright + TypeScript for validating fund transfer workflows in the ParaBank demo banking application.

---

## Tech Stack

- Playwright
- TypeScript
- Node.js
- Allure Reporting
- Winston Logger
- Jenkins CI/CD

---

## Features

- UI, API, E2E and Performance testing
- Page Object Model (POM)
- Custom Playwright Fixtures
- Multi-browser execution
- Allure & HTML Reporting
- Defect validation tests
- Jenkins CI/CD integration
- Data-driven testing

---

## Project Structure

```bash
Playwright-Sprint/
│
├── fixtures/
├── locators/
├── page/
├── tests/
│   ├── ui/
│   ├── api/
│   ├── e2e/
│   └── performance-lite/
│
├── test-data/
├── utils/
├── test-results/
│
├── Jenkinsfile
├── package.json
├── playwright.config.ts
├── README.md
└── tsconfig.json
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
```

### Install Dependencies

```bash
npm install
```

### Install Playwright Browsers

```bash
npx playwright install --with-deps chromium firefox webkit
```

---

## Running Tests

### Run All Tests

```bash
npx playwright test
```

### Run Individual Suites

```bash
npx playwright test tests/ui
npx playwright test tests/api
npx playwright test tests/e2e
npx playwright test tests/performance-lite
```

### Run Specific Tags

```bash
npx playwright test --grep "@smoke"
npx playwright test --grep "@regression"
npx playwright test --grep "@defects"
```

---

## Test Coverage

### Modules Covered

- Fund Transfer Validation
- Balance Verification
- Transaction History Validation
- UI Confirmation Validation
- Negative Testing
- Performance Validation

### Known Defects Covered

| Defect ID | Description |
|-----------|-------------|
| DEF-001 | Same-account transfer allowed |
| DEF-002 | Zero amount accepted |
| DEF-003 | Negative amount accepted |
| DEF-004 | No insufficient balance validation |
| DEF-005 | Special characters partially accepted |
| DEF-006 | Rapid-click duplicate transfers |

---



## Reports

### Playwright HTML Report

```bash
npx playwright show-report
```

### Allure Report

```bash
npx allure serve test-results/allure-results
```

---

## CI/CD

Jenkins pipeline stages include:

```text
Checkout → Install → Type Check
→ UI Tests → API Tests → E2E Tests
→ Performance Tests → Allure Report
```

---

## Author

**Sudip Chel**  
