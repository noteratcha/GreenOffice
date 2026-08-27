# Green Office Project Guidelines

This file contains the accumulated rules, skills, workflow, and styling preferences for the Green Office web application project.

## 1. Tech Stack & Deployment (Apps Script + Clasp)
- **Framework**: Google Apps Script (HtmlService) functioning as a Single Page Application (SPA).
- **Files Structure**: `Code.gs` (Server logic), `Index.html` (DOM/UI), `Stylesheet.html` (CSS), `JavaScript.html` (Client logic).
- **Deployment Strategy**: 
  - Code is pushed to Apps Script using `clasp`.
  - Deployment command: `Copy-Item ..\*.* . -Force; npx @google/clasp push` (Executed inside the `build/` directory).
  - Pushing changes requires manual deployment in the Apps Script Editor (New Version) to reflect changes on the web app.

## 2. Design System & Aesthetics
- **Theme**: Earthy, eco-friendly, green-themed color palette with glassmorphism touches.
- **Color Palette**:
  - Primary Green (Olive): `#768b54`
  - Background / Cream: `#f5f0e6`
  - Secondary Green (Forest): `#3a4f3b`
  - Light Accent (Pale Sage): `#e0e5df`
  - Text / Darkest Green: `#1a2622`

## 3. UI/UX Components & Styles
- **Image Carousel**: Displayed as a **3D Vertical Card Coverflow**. Active cards are scaled up (`scale(1)`), while adjacent cards are scaled down, rotated (`rotateY`), faded, and layered in 3D space (`perspective`, `translateZ`).
- **News Cards**: Uses a floating nested card design where the image is a separate floating card above the content (`border-radius`, `box-shadow` separated from `news-card-body`).
- **News 3D Slider**: Multi-image news items use a CSS-driven 3D continuous slider (`rotateY`) that automatically loops via a central JS interval.
- **News Pagination**: Max 3 items per page. Pagination is built dynamically via JS since backend `getNews` returns everything at once.
- **Floating Action Buttons (FAB)**: Uses `flex-direction: column` so DOM order defines visual top-to-bottom order. Buttons are visible to Admin only and have distinct shadows.
- **Upload Modal**: Uses Drag-and-Drop functionality. Closes automatically upon successful upload and clears the file input to prevent caching issues.
- **Scrolling in Iframe**: Apps Script `href="#id"` doesn't work inside iframes. Smooth scrolling is manually handled in JS by intercepting `.nav-link` clicks and using `element.scrollIntoView({ behavior: 'smooth' })`.
- **Version Numbering**: Displayed in the footer using the format: `vYYYY.MMDD.HHMM` (Year.MonthDay.HourMinute) (e.g., `v2026.0827.1947`).

## 4. Backend Integrations & Logic
- **Authentication**: Checked against Google Sheets. Sheet ID: `10ZhFi99f45BJ5epvT4bqJ0xMCl-UeMsN3pM3Dbv0Dpo` (Sheet name: `user&pass`).
- **File Storage**: Images are uploaded to Google Drive folder ID: `1jmdhZ0VkyC7M0jCg1JVjrCjOgCKq1xzT`.
  - Images are saved in a subfolder named after the logged-in user.
  - Image naming convention: `user+DDMMYYYY_HHMMSS+index.jpg`
- **Payload Limits**: Image uploads are chunked/optimized to avoid Apps Script payload limits (max ~50MB limit, recommended to keep under 5MB per batch).

## 5. Repository Sync
- **GitHub Sync**: When pushing to GitHub, the repository URL is `https://github.com/noteratcha/GreenOffice`.
