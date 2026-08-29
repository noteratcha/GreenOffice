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

## 6. Advanced Layout & UI Techniques (Recent Learnings)
- **Grid Overflow Prevention**: When CSS Grid items contain flex containers or scrollable content that forces the grid to expand beyond its bounds, ALWAYS apply `min-width: 0;` to the grid item itself.
- **Thai Text Word-Wrapping**: For robust text containment (especially long continuous strings without spaces), strictly apply `overflow-wrap: break-word;` and `word-break: break-word;`.
- **Custom Confirm Dialogs**: Strictly avoid native browser `alert()` or `confirm()` dialogs. Use custom-styled HTML/CSS modals (`confirmModal`) integrated with callbacks (`showConfirmModal`) to maintain a premium and consistent UX.
- **Image Lightbox Memory/Flash Fix**: Always clear the `src` attribute of a preview `<img>` tag (`img.src = ''`) when a modal is closed. This prevents the previous image from briefly flashing the next time the modal is opened.
- **Interactive Image Zoom Engine**: For full-screen image previews, implement zoom features using CSS `transform: scale(zoomLevel)` coupled with `transform-origin: X% Y%`. This should be mapped to the mouse `wheel` and `mousemove` events for an intuitive desktop zooming experience.
- **Z-Index Layering**: When dealing with nested or overlapping modals (e.g., opening a photo preview *from within* a news detail modal), manage `z-index` classes systematically (e.g., Backdrop 2000, Top-level modal 3000, Confirm modal 4000).
- **Drive Image Bypassing**: To bypass strict Google Workspace domain policies preventing direct Drive image loading, ALWAYS use the thumbnail API: `https://drive.google.com/thumbnail?id=[ID]&sz=w1200`.
- **Session & Display Name Hydration**: Separate system User IDs from Display Names. Retrieve the friendly name from the database upon login, persist it via `localStorage` (e.g., `go_name`), and hydrate the UI (`userNameDisplay`) with the friendly name upon every refresh.

## 7. Google Sites Iframe Compatibility & Scrolling
- **Internal Iframe Scroll Management (`scrollToSection`)**:
  - **Issue**: When the web app is embedded inside an `<iframe>` on Google Sites (e.g. `https://sites.google.com/view/greenofficereg10`), native `element.scrollIntoView()` propagates scroll events to the parent Google Sites window, causing the iframe to move up and hiding the top fixed navbar off-screen.
  - **Rule**: NEVER use `scrollIntoView()`. ALWAYS use internal `window.scrollTo()` calculations:
    ```javascript
    function scrollToSection(targetId) {
      const targetElement = document.querySelector(targetId);
      if (!targetElement) return;
      const navbar = document.querySelector('.navbar');
      const navHeight = navbar ? navbar.offsetHeight : 64;
      const rect = targetElement.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const targetY = rect.top + scrollTop - navHeight;
      window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
    }
    ```
- **Desktop Single-Line Typography**: For prominent headers and CTA banners, use `@media (min-width: 992px) { white-space: nowrap; }` to maintain single-line layout on desktop screens without awkward line wraps.

## 8. Multi-Stage Upload Progress & Percentage System
- **Real-Time Stage Feedback**:
  - Replace indeterminate spinners with informative progress components (`.upload-progress-wrapper`, `.progress-percentage-badge`, `.progress-status-text`, `.modern-progress-bar`).
  - **Stage 1 (Client-side Compression)**: Compute real-time percentage per file processed (`5% + (i+1)/total * 35%`) with descriptive text (`กำลังบีบอัดและปรับขนาดรูปภาพ X จาก Y (Z%)...`).
  - **Stage 2 (Server Transmission Simulation)**: Smoothly increment percentage from 45% to ~92% during `google.script.run` backend execution.
  - **Stage 3 (Success Completion & Auto-dismiss)**: Set to 100% (`บันทึกข้อมูลสำเร็จเรียบร้อยแล้ว (100%)`), delay for 600-700ms before closing modal and firing toast.
- **Loading Screen Safety Timeout**:
  - Add an automatic safety timeout in `DOMContentLoaded` (3000ms) to ensure `#loadingScreen` is hidden even if Google Drive API responses are slow or encounter network delays.

## 9. Modern Eco Modal UI/UX Design System
- **Standard Modal Header**:
  - Always include `.modal-title-wrapper`, `.modal-icon-badge` (circular eco-themed icon container), Title, and Subtitle (`.modal-subtitle`).
- **Drag & Drop Upload Dropzones**:
  - Replaces raw `<input type="file">` with modern dropzones (`.upload-zone`).
  - Support drag over/leave/drop events and click-to-select.
- **Live Image Previews**:
  - **Multiple images**: Render in `.upload-preview-grid` with thumbnail previews and individual circular `✕` delete buttons.
  - **Single image** (Policy upload): Render in `.policy-preview-card` showing thumbnail, filename, file size (MB), and a quick remove/change button.
- **Interactive Visual Selectors**:
  - **Card Selectors** (`.policy-card-selector`): Replace boring dropdowns with visual option cards displaying icons, titles, descriptions, and active green border/checkmarks.
  - **Color Palette Chips** (`.event-color-palette`, `.color-chip-option`): Visual category chips with colored dots, active rings, and checkmarks for calendar events.
- **Compact Form Grids**:
  - Use 2-column CSS Grid (`grid-template-columns: 1fr 1fr; gap: 0.85rem;`) for related fields like Date and Time to prevent unnecessary modal scrolling.
- **Category Links Manager (`.cat-link-card`)**:
  - Encapsulate each link item in an independent card container with a category number badge (`.cat-badge-num`), dedicated Material Icon, title, URL input with leading icon, and an interactive **"ทดสอบ" (Test Link ↗)** button that tests opening the Google Drive link in a new browser tab.

## 10. Card Metadata & Publisher Name Mapping
- **Friendly Name (`name`) Resolution**:
  - Always map raw login usernames (e.g. `admin`) to friendly display names (`name` column in `user&pass` sheet, with fallback `สำนักงานไปรษณีย์เขต 10`) before sending data to the client.
  - Retain the raw username in `news.user` so author-only and admin edit/delete permission checks continue to work accurately.
- **Card Bottom Alignment via `margin-top: auto`**:
  - In dynamic card grids (such as `.news-card`), wrap metadata elements (date, author badge) inside a footer container (`.news-card-footer`) styled with `margin-top: auto`. This ensures that cards with varying title/description lengths maintain perfectly aligned bottom metadata badges across all rows.

## 11. Nested Horizontal Sub-FAB Groups & Stacking Context
- **Sub-FAB Expansion (`.fab-photos-group`, `.fab-sub-menu`)**:
  - Nested action groups expand smoothly horizontally to the left of the parent trigger (`position: absolute; right: 100%; top: 50%; display: flex; flex-direction: row; gap: 0.85rem;`).
  - Items are ordered naturally from left to right (e.g. Leftmost = ลำดับที่ 1 Upload `add_a_photo`, Middle = ลำดับที่ 2 Manage `edit`, Rightmost = Parent FAB `photo_library`).
- **Connecting Line Behind Buttons (Stacking Context)**:
  - Connecting line pseudo-element (`.fab-sub-menu::before`) extends across sub-items behind the main trigger with `z-index: 1; pointer-events: none;`.
  - Sub-buttons (`.fab-sub`) have `z-index: 2; position: relative;` with solid background and white border.
  - Parent trigger FAB (`.fab-photos-parent`) has `z-index: 10; position: relative;` so that the connecting line is strictly layered **behind** all circular FAB buttons without cutting through button faces or badges.
- **Outside-Click Auto-Collapse**:
  - Global `click` listener dismisses open sub-FAB menus when users click anywhere outside `.fab-photos-group`.

## 12. Dynamic Feedback Form Endpoint Management
- **Dedicated Admin Control**:
  - Expose a specialized FAB (`#fabEditFeedback`) with `rate_review` icon for administrators.
  - Opens `#editFeedbackModal` with live inline "ทดสอบ (Test Link ↗)" verification button.
- **Backend Persistence**:
  - Store and retrieve the Google Forms response URL dynamically via `PropertiesService` (`getFeedbackLink()` / `saveFeedbackLink()`).
  - Enables flexible updates to form endpoints without modifying client-side JavaScript.

## 13. 6-Sheet Resource & Waste Statistics Architecture
- **Dedicated Sheets per Metric**:
  - 6 dedicated Google Sheets correspond 1-to-1 with the 6 UI metrics:
    1. `electricity` -> การใช้ไฟฟ้า (kWh)
    2. `water` -> การใช้น้ำ (m³)
    3. `fuel` -> น้ำมันเชื้อเพลิง (L)
    4. `paper` -> การใช้กระดาษ (Ream)
    5. `ghg` -> ก๊าซเรือนกระจก (kgCO2e)
    6. `recycledWaste` -> นำของเสียกลับมาใช้ (kg)
- **Monthly Breakdown & Annual Sum Calculation**:
  - Row 1: Headers (`ปี`, `ม.ค.`, `ก.พ.`, `มี.ค.`, `เม.ย.`, `พ.ค.`, `มิ.ย.`, `ก.ค.`, `ส.ค.`, `ก.ย.`, `ต.ค.`, `พ.ย.`, `ธ.ค.`).
  - Rows 2..N: Years in Column A, with monthly entries in Columns B through M.
  - Backend `getResourcesData()` calculates the annual total as the sum of all monthly entries in that row, allowing partial-year entries to compute accurately.
- **Visual Chart Rendering (Chart.js + DataLabels)**:
  - Chart bars are grouped by year (e.g. Blue `#5dade2` for Year 1, Green `#52be80` for Year 2).
  - Floating top datalabels with formatted comma separators (`Number(value).toLocaleString()`).
  - Interactive Admin Modal with metric tabs, live auto-calculated row totals, and inline year sorting (ปีมากไปน้อย).

## 14. Dynamic Year Range Selection, Same-Period Percentage Comparison & 30% Overlapping Monthly Chart
- **Dynamic Year Range Selection Toolbar (`#resourceYearFilterBar`)**:
  - Available both on the main page above the 6 chart cards and inside the `#resourceMonthlyDetailModal`.
  - Dropdown 1: **ปีก่อนหน้า / Base Year** (Blue `#5dade2` dot).
  - Dropdown 2: **ปีเปรียบเทียบ / Target Year** (Green `#52be80` dot).
  - Defaults automatically to the 2 latest available years, and dynamically updates all 6 overview charts, badges, and modal charts whenever changed.
- **Same-Period Percentage Calculation**:
  - Compares the sum of recorded months in the target year ($Sum_{curr}$) with the exact same months in the base year ($Sum_{prev}$).
  - Percentage Change formula: $\% = \frac{Sum_{curr} - Sum_{prev}}{Sum_{prev}} \times 100$.
  - Displays dynamic badges: Green (`good`) for reduction in consumption/GHG and for increase in waste recycling; Amber/Rose (`warn`) for increase in consumption.
- **30% Overlapping Monthly Bar Chart Modal (`#resourceMonthlyDetailModal`)**:
  - Clicking any resource card opens a 12-month detailed breakdown modal with custom Chart.js plugin (`overlap30Plugin`).
  - Chart.js overlapping rendering:
    - **Base Year (ปีก่อนหน้า - ด้านหลัง)**: Sky Blue (`rgba(93, 173, 226, 0.78)`), shifted slightly right.
    - **Target Year (ปีเปรียบเทียบ - ด้านหน้า ซ้อนทับ 30%)**: Leaf Green (`rgba(82, 190, 128, 0.95)`), shifted slightly left with 30% horizontal width overlap.
  - Includes summary stat comparison cards and a 12-month table with month-by-month differences and percentage indicators.
- **Y-Axis Dynamic +30% Headroom**:
  - Scales `scales.y.max` & `suggestedMax` are set dynamically to $1.30 \times \text{maxVal}$ (30% above the highest data point) across both monthly detail charts and overview charts to ensure datalabels and tall bars have ample headroom and never clip or touch chart legends.
