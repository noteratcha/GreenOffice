# Green Office Project Guidelines

This file contains the accumulated rules, skills, workflow, architectural patterns, and styling preferences for the Green Office web application project.

## 1. Tech Stack & Deployment (Apps Script + Clasp)
- **Framework**: Google Apps Script (HtmlService) functioning as a Single Page Application (SPA).
- **Files Structure**: 
  - `Code.gs` (Server-side logic, Google Sheets & Drive APIs)
  - `Index.html` (DOM / Modal templates, Layout sections)
  - `Stylesheet.html` (Vanilla CSS design system, Glassmorphism, animations)
  - `JavaScript.html` (Client-side controllers, FullCalendar init, animation intervals, image processing)
  - `appsscript.json` (Manifest with explicit OAuth scopes: `drive`, `spreadsheets`)
- **Deployment & Sync Rules**: 
  - Every time any file in the project is modified, it **MUST be copied to the `build/` folder** and deployed using `node scratch/sync_build.js`, `cd build`, and `clasp push -f`.
  - For rapid testing, always use the `/dev` URL.
  - When updating `/exec` (production link on `@thailandpost.com`), manual deployment (New Version) via Apps Script UI is required due to Google Workspace domain security restrictions.

## 2. Design System & Aesthetics
- **Theme**: Earthy, eco-friendly, green-themed color palette with glassmorphism touches.
- **Color Palette**:
  - Primary Green (Olive): `#768b54`
  - Background / Cream: `#f5f0e6`
  - Secondary Green (Forest): `#3a4f3b`
  - Light Accent (Pale Sage): `#e0e5df`
  - Text / Darkest Green: `#1a2622`
- **Typography & Compatibility**: Use standard properties alongside vendor prefixes (e.g. `line-clamp` alongside `-webkit-line-clamp`) for maximum compatibility. Avoid native browser `alert()` popups; use the built-in `showToast(msg, type)` system for a premium feel.

## 3. UI/UX Components & Styles
- **Activity Carousel**: 3D Vertical Card Coverflow with scale, depth (`translateZ`), and rotation (`rotateY`). Clicking the active center card opens a Fullscreen HD Lightbox preview modal with zoom cursor.
- **News Section**:
  - **3-Column Grid**: 3 items per row on desktop with responsive mobile/tablet breakpoints.
  - **Pagination**: Exactly 3 items per page.
  - **Sequential Left-to-Right 3D Slider**: Multi-image news cards cycle their images sequentially from left to right (Card 1 -> Card 2 -> Card 3) with a fixed 3-second delay between each card switch.
  - **News Detail Modal & Gallery (2-Column Modal-XL)**:
    - Title: `รายละเอียดข่าวสารกิจกรรม`
    - Sized at `width: 70vw; max-width: 1200px` (leaving 30% viewable margin).
    - **Left Column**: Interactive Gallery (Large Main Image + cleanly aligned horizontal Thumbnails; main image has no zoom popup on click).
    - **Right Column**: Clean Thai Date (`D MMMM YYYY โดย [user]`), Title, scrollable Content, and Action buttons.
    - Responsive: Automatically stacks to 1 column on mobile/tablet screens.
- **Edit News Modal (Interactive Image Manager)**:
  - Displays existing photos in a thumbnail grid with individual red delete buttons (`x`).
  - Allows selecting additional photos with "+ เพิ่มรูปภาพ", which display with a "ใหม่" tag.
  - Granularly submits kept image IDs + newly compressed images to `editNews(row, title, content, keptIds, newImages)`.
- **Calendar Section (`#calendar-section`)**:
  - Integrated using **FullCalendar v6 CDN**.
  - Includes Thai language support, monthly and list views.
  - Connected to the `calendar` Google Sheet for persistent storage of events.
  - Event colors categorized by type (Green = General, Blue = Meeting, Orange = Important, Red = Urgent).
- **Categories Section (`#categories`)**:
  - Section titled "7 หมวด Green Office".
  - Layout: 4-column grid (`width: calc(25% - 1.5rem)`), making it elegantly wrap into 2 rows (4 cards on top, 3 centered on the bottom).
  - Configurable external links to Google Drive, editable by admin via the Edit Categories FAB.
- **Resource Statistics Dashboard (`#resources-section`)**:
  - Titled "สถิติการใช้ทรัพยากร พลังงาน และการจัดการของเสีย".
  - Implemented using **Chart.js CDN**.
  - Layout: 6 individual charts structured in a responsive CSS Grid (3 columns on desktop, wrapping to 2 or 1 on smaller screens).
  - Data Visualization: Displays annual comparisons (latest 2 years) with consistent styling (Blue for older year, Green for newer year) and hidden x-axes for a clean, minimalist UI.
  - Value Labels: Implemented `chartjs-plugin-datalabels` to display absolute numbers on top of bars, formatted with comma thousand separators (`.toLocaleString()`).
  - State Management: Chart instances are tracked in a `resourcesChartInstances` object and `.destroy()` is actively called before re-rendering to prevent canvas overlaps/memory leaks.
  - Data connected directly to the `resources` Google Sheet.
- **Floating Action Buttons (FAB)**: 
  - Column layout anchored to bottom-right.
  - **Admin-Only**: Upload (`fabUpload`), Manage Photos (`fabManagePhotos`), Add Event (`fabAddEvent`), Edit Categories (`fabEditCategories`).
  - **All Logged-in Users**: Add News (`fabAddNews`).
- **Navigation Menu**: Contains anchor links with smooth scrolling to `#home`, `#news`, `#calendar-section`, and `#categories`.
- **Version Numbering**: Displayed in footer as `vYYYY.MMDD.HHMM` (Not bolded for cleaner aesthetics).

## 4. Backend Integrations, Permissions & Security
- **Authentication**: Checked against Google Sheet ID: `10ZhFi99f45BJ5epvT4bqJ0xMCl-UeMsN3pM3Dbv0Dpo` (Sheet: `user&pass`).
- **Data Storage**:
  - **News (`news` sheet)**: title, content, date, imageFileId, user.
  - **Calendar (`calendar` sheet)**: id, title, start (datetime), end, backgroundColor, allDay.
  - **Resources (`resources` sheet)**: id, year, electricity, water, fuel, paper, ghg, recycledWaste, user.
- **Role-based Permissions**:
  - Authors can edit/delete their own news.
  - Admins have master permissions to edit/delete any news, manage categories, and add calendar events.
  - Display Name Mapping: When author/user is `admin`, the UI dynamically formats the display name to `สำนักงานไปรษณีย์เขต 10`.
- **Google Drive Storage & Domain Policies**:
  - Folder ID: `1jmdhZ0VkyC7M0jCg1JVjrCjOgCKq1xzT`.
  - Subfolder `news/` for news images; user-named subfolders for activity uploads.
  - `file.setSharing(...)` must always be wrapped in `try/catch` to ensure compatibility with enterprise domains (`@thailandpost.com`) that restrict public link sharing.
  - Fail-safe decoupled saving: Database records are preserved even if Drive service encounters network/policy interruptions.

## 5. Client-Side Performance & Image Handling
- **Smart Image Compression**: All image uploads are processed client-side via HTML5 Canvas (`processFilesToBase64`) to max 1280px, quality 0.75 before base64 encoding. This:
  - Reduces file size by >90%.
  - Bypasses Apps Script parameter payload limitations.
  - Guarantees fast, reliable uploads from mobile devices.
- **Async/Await Validation**: File streams are fully resolved before dispatching `google.script.run`.
