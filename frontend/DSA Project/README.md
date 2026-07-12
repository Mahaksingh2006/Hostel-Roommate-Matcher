# HostelMatch Pro

HostelMatch Pro is a standalone frontend application for matching college hostel roommates using DSA-inspired client-side logic. It uses static HTML, CSS, JavaScript, mock data, and CDN-based frontend libraries only.

## Features

- Add, edit, delete, search, filter, and sort student profiles.
- Load static demo students from `assets/js/mock-data.js`.
- Calculate roommate compatibility using weighted preferences.
- Rank recommendations by compatibility score.
- Auto-assign roommates using a greedy best-available match strategy.
- Dashboard with animated counters, recent activity, quick stats, charts, and heatmap.
- Modern responsive UI with dark mode, glassmorphism cards, animations, toasts, dialogs, FAB, and scroll-to-top.
- Export match recommendations to PDF or Excel and print reports.
- Teacher-friendly DSA explanation for HashMap, sorting, greedy matching, time complexity, and space complexity.

## Project Structure

```text
E:\DSA Project
|-- index.html
|-- README.md
|-- PROJECT_REPORT.md
`-- assets
    |-- css
    |   `-- styles.css
    `-- js
        |-- app.js
        `-- mock-data.js
```

## How to Run

Option 1: open `index.html` directly in any modern browser.

Option 2: open the folder in VS Code and use the Live Server extension for the smoothest local preview.

No backend, database, server, compiler, or installation step is required.

## Frontend Libraries

The app uses CDN links for Google Fonts, Chart.js, jsPDF, SheetJS, and Lottie Player. Internet access is needed for CDN-powered charts, exports, fonts, and animation during presentation.

## DSA Logic

- **HashMap:** JavaScript `Map` stores students by ID for efficient lookup.
- **Sorting:** recommendations are sorted by compatibility score.
- **Arrays:** students, hobbies, match results, and chart data use arrays.
- **Greedy Matching:** auto-assignment selects the best available roommate for each unassigned student.

## Compatibility Score

| Preference | Marks |
| --- | ---: |
| Same room type | 20 |
| Same sleep schedule | 20 |
| Same cleanliness level | 15 |
| Same food habit | 15 |
| Same study preference | 15 |
| Same branch or same year | 5 |
| Common hobbies | Up to 10 |

Total score: 100.

## Assumptions

- The final project is frontend-only.
- Data is stored in browser memory for demo purposes.
- Static mock data replaces backend APIs.
- No authentication, server routes, database, or backend code is included.
