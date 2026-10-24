# Sift Design System & UI Specification

> **Philosophy**: Editorial, calm, information-dense but airy.  
> Sift draws aesthetic inspiration from Linear, Vercel Dashboard, and Are.na. It rejects typical SaaS landing-page bloat, saturated gradients, bouncy animations, and cartoonish illustrations. Every pixel exists to surface signal with quiet dignity.

---

## 1. Visual Manifesto & Forbidden Patterns

To maintain a calm, high-signal reading environment, the following are strictly prohibited:

- ❌ **No gradients anywhere**: No background gradients, mesh gradients, text gradient clips, or glowing card borders.
- ❌ **No glassmorphism**: No frosted glass, `backdrop-blur` stacks, or translucent glowing panels.
- ❌ **No floating drop shadows**: Standard cards and rows use 1px hairline borders instead of shadows. Shadows are permitted **only** on floating popovers, dropdown menus, and command palettes (`0 4px 20px rgba(0, 0, 0, 0.15)`).
- ❌ **No emoji as icons**: Every icon must be a Lucide SVG stroke icon (stroke width `1.5`, size `16px`).
- ❌ **No multi-colored badge rainbows**: Tags are quiet, monochromatic chips. Only the single vermilion accent is permitted for active match highlights.

---

## 2. Color Tokens

Sift uses warm neutrals with **exactly one accent**: warm vermilion (`#E5533D`). Vermilion is used with extreme restraint—reserved strictly for primary buttons, focus rings, and high-relevance match highlights.

### Dark Theme (Default)
| Token | Value | CSS Variable | Semantic Usage |
| :--- | :--- | :--- | :--- |
| **Background** | `#0B0B0C` | `--bg` | Application canvas, viewport base |
| **Surface** | `#131314` | `--surface` | Job rows, filter rail, card containers, dialogs |
| **Border** | `rgba(255, 255, 255, 0.08)` | `--border` | Hairline dividers, 1px container boundaries |
| **Border Strong** | `rgba(255, 255, 255, 0.16)` | `--border-strong` | Active inputs, focused elements, hover boundaries |
| **Text Primary** | `#EDEDEA` | `--text` | Headlines, job titles, primary data |
| **Text Muted** | `#8A8A85` | `--text-muted` | Company name, location, dates, metadata |
| **Accent (Vermilion)**| `#E5533D` | `--accent` | Primary action button, active focus ring, match pill |
| **Accent Hover** | `#D4432E` | `--accent-hover` | Hover state for accent buttons |
| **Accent Subdued** | `rgba(229, 83, 61, 0.12)` | `--accent-subdued`| Active filter background, match highlight container |

### Light Theme
| Token | Value | CSS Variable | Semantic Usage |
| :--- | :--- | :--- | :--- |
| **Background** | `#FAFAF8` | `--bg` | Warm off-white newsprint page canvas |
| **Surface** | `#FFFFFF` | `--surface` | Pure white job cards, filter sheets, command bar |
| **Border** | `rgba(0, 0, 0, 0.08)` | `--border` | Subtle hairline structure |
| **Border Strong** | `rgba(0, 0, 0, 0.18)` | `--border-strong` | Input outlines, active element boundary |
| **Text Primary** | `#141414` | `--text` | High-contrast black ink for titles and primary labels |
| **Text Muted** | `#6E6E6A` | `--text-muted` | Secondary details, metadata, subheaders |
| **Accent (Vermilion)**| `#E5533D` | `--accent` | Primary action button, focus rings |
| **Accent Hover** | `#CE432F` | `--accent-hover` | Accent action hover |
| **Accent Subdued** | `rgba(229, 83, 61, 0.08)` | `--accent-subdued`| Subtle warm vermilion wash for active match chips |

---

## 3. Typography

Typography creates the visual hierarchy. We use three deliberate font families:

1. **Geist Sans**: Primary interface font for all navigation, titles, job names, descriptions, and body copy.
2. **Geist Mono**: Dedicated metadata font for location, salary ranges, duration, timestamps, and ATS provenance.
3. **Instrument Serif**: Reserved **strictly** for the main editorial landing headline (never in body or UI components).

### Typographic Scale
| Token | Font Family | Size | Weight | Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `text-display` | Instrument Serif | 56px (`3.5rem`) | 400 | 1.1 | `-0.025em` | Hero editorial headline |
| `text-title-lg`| Geist Sans | 32px (`2.0rem`) | 500 | 1.2 | `-0.02em` | Section headings, job detail title |
| `text-title-sm`| Geist Sans | 20px (`1.25rem`)| 500 | 1.35 | `-0.015em`| Job row title, modal headers |
| `text-body` | Geist Sans | 16px (`1.0rem`) | 400 | 1.55 | `0` | Primary reading text, summaries |
| `text-body-sm` | Geist Sans | 14px (`0.875rem`)| 400 | 1.5 | `0` | Filter labels, input text |
| `text-meta` | Geist Mono | 13px (`0.8125rem`)| 400 / 500 | 1.4 | `+0.01em` | Metadata, tags, salary, location |
| `text-caption` | Geist Mono | 12px (`0.75rem`)| 400 | 1.4 | `+0.02em` | Timestamps, ATS source label |

---

## 4. Spacing, Borders & Shadows

- **Base Unit**: `4px` grid with an `8pt` rhythmic cadence (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`).
- **Border Radius**:
  - `radius-surface`: `10px` for cards, dialog sheets, search containers, and popovers.
  - `radius-control`: `6px` for inputs, buttons, filter chips, and badges.
- **Hairline Borders**:
  - All cards, headers, sidebars, and rows use a crisp `1px solid var(--border)` instead of floating drop-shadows.
- **Shadows**:
  - Only allowed on floating menus and popovers: `0 4px 20px rgba(0, 0, 0, 0.15)` (dark) / `0 4px 20px rgba(0, 0, 0, 0.08)` (light).

---

## 5. Icons & Motion

- **Icon Library**: [Lucide](https://lucide.dev/).
- **Stroke Width**: `1.5px` strict.
- **Icon Size**: `16px` standard (occasional `14px` for tight inline metadata).
- **Motion Spec**:
  - Duration: `150ms`.
  - Timing function: `cubic-bezier(0.16, 1, 0.3, 1)` or `ease-out`.
  - Properties permitted to animate: `opacity` and `transform` (subtle `translateY` of 2-4px max).
  - Respects `@media (prefers-reduced-motion: reduce)`: all transitions collapse to instantaneous.

---

## 6. Core Component Catalog (To Be Implemented)

1. **`SearchBar`**: Centered, expansive command input with vermilion focus ring and `⌘K` shortcut trigger.
2. **`FilterRail`**: Sticky, quiet left sidebar with grouped chips (Role, Experience, Remote, Tech Stack, Compensation).
3. **`JobRow`**: Information-dense horizontal listing with company, title, location, salary badge, ATS source tag, and direct apply link.
4. **`Chip`**: Interactive toggle button with `6px` radius, hairline border, and subtle vermilion fill when selected.
5. **`Badge`**: Non-interactive metadata indicator (e.g., `Remote`, `Greenhouse`, `>$180k`).
6. **`Skeleton`**: Subtle pulsing placeholder using `--surface` and hairline border.
7. **`EmptyState`**: Understated editorial message with helpful query suggestions.
8. **`CommandPalette`**: Quick keyboard-driven navigator overlay (`⌘K`).
