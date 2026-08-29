# GreenOffice Design System

## Color Palette
The website uses an earthy, green-themed color palette. Whenever implementing styles or components, adhere to the following colors (or closely approximate values based on user's reference images):

1. **Primary Green (Olive)**: `#768b54`
2. **Background / Cream (Off-White)**: `#f5f0e6`
3. **Secondary Green (Forest)**: `#3a4f3b`
4. **Light Accent (Pale Sage)**: `#e0e5df`
5. **Text / Darkest Green**: `#1a2622`

## General Rules
- Always use these colors for the primary UI elements (buttons, headers, backgrounds, text).
- Avoid using generic primary colors (like pure red, blue, green).
- Implement a modern, clean, and dynamic design utilizing these tones.

## Component Design Tokens
- **Modal Header**: Icon badge container (`.modal-icon-badge`: 44x44px circular, bg `var(--color-sage)`, color `var(--color-forest)`), Title (font-weight 700), and Subtitle (0.82rem, color `#666`).
- **Dropzone (`.upload-zone`)**: Dashed border (`2px dashed var(--color-sage)`), smooth hover glow, icon 48px, friendly Thai instructional copy.
- **Progress Track & Bar (`.modern-progress-track`, `.modern-progress-bar`)**: Pill-shaped track (`height: 8px; border-radius: 999px; bg: #dfe6dc;`), gradient fill (`linear-gradient(90deg, var(--color-primary), #4a6344)`), live percentage badge (`.progress-percentage-badge`).
- **Color Palette Chips (`.color-chip-option`)**: Rounded pill (`border-radius: 20px; bg: #f8faf7; border: 1.5px solid #dce4d9`), active state with ring shadow and checkmark icon.
- **Visual Card Selector (`.policy-select-option`)**: Card option with 1.5px border, rounded md, active ring shadow `0 0 0 3px rgba(118, 139, 84, 0.15)`.
