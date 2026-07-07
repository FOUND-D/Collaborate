# Collaborate – UI/UX Light Theme Styling Architecture

Collaborate is styled with a production-level, clean, and professional purely **Light Theme** interface. All dark mode switches, variables, and general glassmorphism effects on page backgrounds have been removed to ensure a solid, premium SaaS aesthetic.

---

## 1. Theme Configuration & Tokens
The styling utilizes a custom property system defined in [theme.css](file:///Users/bhavya_agarwal/Desktop/projects/Collaborate/client/src/theme.css) and [global.css](file:///Users/bhavya_agarwal/Desktop/projects/Collaborate/client/src/global.css).

### 🌟 Active Theme Color Palette

*   **Primary Background** (`--bg-primary`): `#f5f3f0` (Warm soft gray)
*   **Card Background** (`--bg-secondary`): `#ffffff` (Pure white)
*   **Input Background** (`--bg-tertiary`): `#e9e6e1` (Light border/inset gray)
*   **Primary Text** (`--text-primary`): `#1a1a1a` (Dark slate gray)
*   **Muted Text** (`--text-secondary`): `#6b7280` (Cool secondary gray)
*   **Tertiary Text** (`--text-tertiary`): `#9ca3af` (Light text gray)
*   **Borders** (`--border-color`): `#e5e2dc` (Soft outline gray)
*   **Accent Color** (`--accent-color`): `#14b8a6` (Teal)
*   **Accent Hover** (`--accent-hover`): `#0d9488` (Dark Teal)
*   **Accent Gradients**:
    *   `--accent-gradient`: `linear-gradient(135deg, #14b8a6, #0d9488)`
    *   `--accent-gradient-vivid`: `linear-gradient(135deg, #14b8a6 0%, #0d9488 52%, #5eead4 100%)`

### 🛠 Status Pill Colors (`--status-*`)
*   **Completed**: Emerald style (`#d1fae5` bg, `#065f46` text)
*   **In Progress**: Ocean style (`#dbeafe` bg, `#1e40af` text)
*   **Pending**: Light gray style (`#f3f4f6` bg, `#6b7280` text)
*   **Blocked**: Soft red style (`#fee2e2` bg, `#991b1b` text)

---

## 2. Flat Layout & Shell Structure
*   **Main Container** (`.app-layout`): Full width/height layout with `--bg-primary` base. Radial gradients are completely removed.
*   **Main Content Card** (`.main-content` / `.main-content-shifted`): Flat panels taking full width and height with zero border-radius, no floating cards, and no margins.
*   **Sidebar** (`.sidebar`): Stably rendered using flat `--sidebar-bg` (`#f0ede8`) and `--sidebar-border` (`#e5e2dc`), with all blurs removed.

---

## 3. Flat Card, Button, and Input Standards
*   **Card Components**:
    ```css
    .card, [class*="card"], [class*="panel"], [class*="glass"] {
      background: var(--card-bg) !important;
      border: 1px solid var(--card-border) !important;
      border-radius: var(--card-radius) !important;
      box-shadow: var(--shadow-sm) !important;
    }
    ```
*   **Primary Actions**:
    ```css
    .btn-primary, .phase2-button-primary, [class*="button-primary"] {
      background: var(--accent-gradient) !important;
      color: white !important;
      border: none !important;
      border-radius: 8px !important;
      padding: 8px 18px !important;
      height: 38px !important;
      font-size: 14px !important;
    }
    ```
*   **Inputs**:
    ```css
    input, select, textarea {
      background: var(--input-bg) !important;
      border: 1px solid var(--input-border) !important;
      border-radius: 8px !important;
      padding: 8px 12px !important;
    }
    ```

---

## 4. Glassmorphic Modals & Dropdowns
Glassmorphism is **strictly preserved only on overlay modals and dropdown panels** to maintain a clean depth hierarchy:
*   `--glass-bg`: `rgba(255, 255, 255, 0.82)`
*   `--glass-backdrop`: `blur(20px) saturate(160%)`
*   `--glass-shadow`: `0 16px 40px rgba(0, 0, 0, 0.08)`

---

## 5. Animation Library
All transitions, staggered grids (`.stagger-grid`), and card tilt effects (`.card-interactive`) are kept in [animations.css](file:///Users/bhavya_agarwal/Desktop/projects/Collaborate/client/src/animations.css) to add interactive delight to the light theme.
