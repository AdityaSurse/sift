# Sift Design System & Visual Specification

> **Philosophy**: Modern, airy, editorial tech aesthetic. Inspired by Simplify’s clarity, high-contrast serif headlines, and rounded pill architecture, but intentionally shifted into Sift's original **Aegean Marine Teal & Deep Caspian Slate** identity. Built for speed, high-signal reading, zero dark patterns, and full accessibility.

---

## 1. Palette Extraction & Color Architecture

### Reference Sampling & Sift Hue Shift
| Token Name | Reference Concept | Sift Original Shift (Light) | Sift Original Shift (Dark) | Semantic Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Page Background (`--bg`)** | Off-white canvas / Deep dark | `#FAFBFC` (porcelain canvas) | `#080C10` (obsidian midnight) | Base viewport, page canvas |
| **Surface (`--surface`)** | Crisp white card / Slate panel | `#FFFFFF` (elevated white) | `#0E141D` (midnight surface) | Cards, detail pane, modals |
| **Surface Subdued (`--surface-subdued`)** | Soft inset gray | `#F1F5F8` (soft cool wash) | `#141C26` (elevated inset) | Secondary wells, code blocks, row hovers |
| **Border (`--border`)** | Hairline slate border | `rgba(15, 23, 42, 0.08)` (`#E2E7ED`) | `rgba(255, 255, 255, 0.08)` (`#1E2735`)| Crisp 1px boundaries, card edges |
| **Border Strong (`--border-strong`)** | Active input outline | `#CBD5E1` | `#2E3A4B` | Focused inputs, hover borders |
| **Text Primary (`--text`)** | Deep rich ink / Crisp white | `#0A0E14` (dense ink black) | `#F8FAFC` (high-contrast silver) | Headlines, primary labels, titles |
| **Text Muted (`--text-muted`)** | Cool slate gray | `#536474` (oceanic slate) | `#94A3B8` (cool zinc) | Subtitles, company name, timestamps |
| **Primary Accent (`--accent`)** | Bright cyan spark | `#0A7D87` (Aegean marine teal) | `#18C5D2` (vivid marine cyan) | Brand highlights, active toggles, icons |
| **Accent Hover (`--accent-hover`)** | Darker cyan | `#08666E` | `#14B3BF` | Interactive hover states |
| **Accent Subdued (`--accent-subdued`)** | Cyan wash | `rgba(10, 125, 135, 0.08)` | `rgba(24, 197, 210, 0.12)` | Active filter chips, match badge pills |
| **Primary Pill Button (`--btn-primary`)** | Deep slate pill button | `#0A262E` (deep Caspian slate) | `#14B8A6` (vivid marine teal) | Main CTA buttons ("Search", "Apply") |
| **Primary Button Text (`--btn-primary-text`)** | Contrast text | `#FFFFFF` | `#04151A` | Text inside primary pill button |
| **Success / Live (`--success`)** | Emerald status | `#059669` / `#ECFDF5` | `#34D399` / `rgba(52, 211, 153, 0.1)` | 24h fresh badge, live crawl indicators |
| **Warning (`--warning`)** | Amber | `#D97706` / `#FFFBEB` | `#FBBF24` / `rgba(251, 191, 36, 0.1)` | Expiring positions, warnings |
| **Error (`--error`)** | Rose red | `#E11D48` / `#FFF1F2` | `#FB7185` / `rgba(251, 113, 133, 0.1)` | Failed crawls, validation errors |

---

## 2. Typography

1. **Display Headline (`font-serif`)**: [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif).
   - High-contrast, sharp editorial serif used exclusively for hero display headlines.
   - Sizing: `text-44` to `text-64` with tracking `-0.025em` and `font-normal`.
2. **Interface Sans (`font-sans`)**: [Geist Sans](https://vercel.com/font) / Clean Modern Sans (`-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`).
   - Sizing: `13px` (sub-labels), `14px` (body copy, inputs), `15px` (titles, subheads), `16px` (hero text), `18px`-`20px` (card titles).
3. **Metadata Mono (`font-mono`)**: [Geist Mono](https://vercel.com/font) (`SF Mono, monospace`).
   - Sizing: `11px`-`12px` with letter-spacing `+0.01em` for timestamps, ATS provenance badges, salary bounds, and counts.

---

## 3. Border Radii & Elevation

- **Pill Controls (`rounded-full`)**:
  - Primary hero buttons, search action buttons, filter pills, monogram circular accents.
- **Large Showcase Surfaces (`rounded-2xl` = `16px`)**:
  - Hero search capsule, "How it works" interactive product mockups, modal containers.
- **Standard Cards & Panes (`rounded-xl` = `12px`)**:
  - Category tiles, dense job list containers, right-side `JobDetailPane`.
- **Badges & Chips (`rounded-full` or `rounded-lg` = `8px`)**:
  - Filter chips, skill badges, match rationale pills.
- **Shadow System**:
  - Light mode: Soft diffused ambient shadows:
    - Card: `0 2px 8px -2px rgba(10, 25, 35, 0.05), 0 1px 3px rgba(10, 25, 35, 0.03)`
    - Floating / Popover: `0 12px 36px -6px rgba(10, 25, 35, 0.12), 0 4px 12px -2px rgba(10, 25, 35, 0.05)`
  - Dark mode: Crisp 1px hairline border with subtle midnight depth:
    - Popover: `0 16px 40px -8px rgba(0, 0, 0, 0.65)`

---

## 4. Component Styles

### Buttons
- **Primary Pill**: `rounded-full bg-[var(--btn-primary)] text-[var(--btn-primary-text)] px-6 py-2.5 font-sans text-14 font-medium transition-all hover:opacity-90 active:scale-[0.98] shadow-sm`
- **Secondary**: `rounded-full border border-border bg-surface text-text hover:bg-surface-subdued px-5 py-2 font-sans text-13 font-medium transition-colors`
- **Ghost**: `rounded-full text-text-muted hover:text-text hover:bg-surface-subdued px-3.5 py-1.5 font-sans text-13 transition-colors`

### Inputs
- **Hero Search Capsule**: `rounded-full border border-border/80 bg-surface shadow-card focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all p-1.5 flex items-center`
- **Standard Input**: `rounded-xl border border-border bg-surface px-3.5 py-2 text-14 text-text placeholder:text-text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none`

### Chips & Badges
- **Active Filter Pill**: `rounded-full border border-accent/40 bg-accent-subdued text-accent px-3 py-1 font-sans text-12 font-medium`
- **Inactive Filter Pill**: `rounded-full border border-border bg-surface text-text-muted hover:border-border-strong hover:text-text px-3 py-1 font-sans text-12 transition-colors`
- **Skill Chip**: `rounded-full border border-border/70 bg-surface-subdued px-2.5 py-0.5 font-mono text-11 text-text-muted`

### Two-Pane Master-Detail Layout (`/jobs`)
- **Top Sticky Bar**: Persistent search bar + quick category filter pills + total live counts.
- **Left Column**: Dense job rows (`rounded-xl` container with subtle dividers). Monogram pill, bold position title, company name, mono location & duration, skill tags, relative posted time, and bookmark toggle.
- **Right Column (Sticky)**: `JobDetailPane` displaying company header, verified direct ATS badge, full skills list, formatted job description, and full-width Caspian/Marine primary Apply button.

---

## 5. Motion Specification

- **Duration**: `150ms`-`200ms`.
- **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Reduced Motion**: Full support via `@media (prefers-reduced-motion: reduce)` which collapses animations to instantaneous.
