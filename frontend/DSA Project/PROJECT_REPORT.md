# HostelMatch Pro: College Hostel Roommates and Preference Matcher

## Introduction

HostelMatch Pro is a frontend-only web application that recommends compatible hostel roommates based on student preferences. It is designed as a polished college project and portfolio demo with dashboards, charts, responsive UI, and clear DSA explanations.

## Problem Statement

Hostel room allocation can become difficult when many students have different lifestyles, food habits, study preferences, and room expectations. This project solves the problem by comparing student preferences and ranking the most compatible roommate options.

## Objectives

- Maintain student profiles in the browser.
- Recommend compatible roommates using weighted scoring.
- Display results with visual explanations.
- Show dashboard statistics and charts.
- Demonstrate DSA concepts in an interactive frontend application.
- Keep the project fully frontend-only with mock/static data.

## Technology Used

- HTML
- CSS
- JavaScript
- Chart.js
- jsPDF
- SheetJS
- Lottie Player
- Static mock data

## System Design

The application is organized as a static frontend project:

- `index.html` defines the dashboard, forms, charts, and report sections.
- `assets/css/styles.css` controls layout, responsive design, dark mode, and animations.
- `assets/js/mock-data.js` stores demo student records.
- `assets/js/app.js` manages state, rendering, matching, charts, exports, and interactions.

No backend server, database, API route, or authentication service is used.

## DSA Concepts Used

### HashMap

JavaScript `Map` stores student profiles by student ID. This allows efficient add, search, update, and delete operations.

Average complexity:

- Insert: `O(1)`
- Search: `O(1)`
- Update: `O(1)`
- Delete: `O(1)`

### Sorting

Roommate recommendations are stored in an array and sorted by compatibility score in descending order.

Complexity:

- Sorting recommendations: `O(n log n)`

### Arrays

Arrays are used for student lists, hobbies, match results, chart data, and activity records.

### Greedy Matching

The auto-assignment feature selects the best currently available roommate for each unassigned student. This makes the algorithm simple to explain and practical for a college DSA project.

## Compatibility Algorithm

The system compares two students and calculates a compatibility score out of 100.

| Criteria | Score |
| --- | ---: |
| Same room type | 20 |
| Same sleep schedule | 20 |
| Same cleanliness level | 15 |
| Same food habit | 15 |
| Same study preference | 15 |
| Same branch or same year | 5 |
| Common hobbies | Up to 10 |

Recommendation steps:

1. Select a student.
2. Find all unassigned students except the selected student.
3. Calculate compatibility score with each candidate.
4. Sort candidates by score.
5. Display the top matches with visual explanation.

## UI/UX Features

- Responsive dashboard for desktop, tablet, and mobile.
- Dark mode.
- Animated counters.
- Compatibility cards with circular progress.
- Charts for gender distribution, department count, compatibility distribution, and activity.
- Compatibility heatmap.
- Toast notifications and confirmation dialogs.
- PDF, Excel, and print report options.

## Time and Space Complexity

For `n` students:

- Add/search/update/delete student: average `O(1)`
- Generate recommendations: `O(n log n)`
- Auto assignment: approximately `O(n^2 log n)` in the current simple greedy implementation
- Space complexity: `O(n)` for students and recommendation lists

## Limitations

- Data is stored in memory and resets after page reload.
- CDN-powered features need internet access.
- Greedy matching is simple and explainable but may not always produce the globally optimal allocation.

## Future Scope

- Add localStorage persistence.
- Add offline vendor files for CDN libraries.
- Add advanced graph-based matching.
- Add more detailed reporting and analytics.

## Conclusion

HostelMatch Pro is a complete frontend-only DSA project that combines practical roommate matching with modern UI/UX. It demonstrates HashMap usage, sorting, arrays, greedy matching, and complexity analysis while remaining easy to run and present without any backend setup.
