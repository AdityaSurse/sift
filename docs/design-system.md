# Sift Design System & Engineering Tokens

> **Philosophy**: Calm, Editorial, Typographic, High-Signal.  
> Sift is an index for serious job discovery. It rejects the noise of algorithmic feeds, neon dashboards, and recruitment spam. The interface feels like a finely typeset journal or a high-end reference library.

---

## 1. Visual Manifesto & Forbidden Elements

To preserve dignity and clarity, the following patterns are **strictly forbidden** across all Sift surfaces:

- ❌ **No purple/blue gradient backgrounds or neon mesh gradients.**
- ❌ **No glassmorphism, backdrop-blur card stacking, or translucent frosted surfaces.**
- ❌ **No glowing blobs, animated ambient lights, or floating particle effects.**
- ❌ **No emoji as icons.** All icons must be geometric SVG stroke icons (1.5px stroke).
- ❌ **No default Tailwind card grids with deep floating drop-shadows** (`shadow-xl`, `shadow-2xl`, colored shadows).
- ❌ **No generic hero banners with vague marketing slogans.**
- ❌ **No stock illustrations, 3D clay characters, or cartoon avatars.**

---

## 2. Color Tokens

Sift uses a warm, paper-inspired monochromatic palette with high-contrast ink and restrained status accents.

### Light Mode (Default)
| Token | Value | Semantic Role |
| :--- | :--- | :--- |
| `--color-canvas` | `#FBFBFA` | Primary page background (warm newsprint paper) |
| `--color-surface` | `#F4F4F1` | Secondary containers, filters, sidebar panels |
| `--color-surface-elevated` | `#FFFFFF` | Reader document sheet, search bar surface |
| `--color-border-subtle` | `#E5E5E2` | Hairline dividers, card outlines (1px solid) |
| `--color-border-strong` | `#D4D4CE` | Input borders, active element boundaries |
| `--color-ink-primary` | `#18181B` | High-contrast headline text, primary titles |
| `--color-ink-secondary` | `#52525B` | Body copy, job summaries, descriptions |
| `--color-ink-muted` | `#71717A` | Metadata (dates, ATS names, locations) |
| `--color-ink-faint` | `#A1A1AA` | Form placeholders, deactivated controls |
| `--color-accent` | `#18181B` | Primary action buttons (solid ink) |
| `--color-accent-hover` | `#27272A` | Hover state for primary action |
| `--color-status-remote` | `#15803D` | Subtle forest green tag for Remote verification |
| `--color-status-salary` | `#854D0E` | Muted ochre tag for verified pay bands |

### Dark Mode (Quiet Ink)
| Token | Value | Semantic Role |
| :--- | :--- | :--- |
| `--color-canvas` | `#121213` | Deep charcoal soot (not pure `#000000`) |
| `--color-surface` | `#1A1A1C` | Panel backgrounds, elevated surfaces |
| `--color-surface-elevated` | `#222225` | Active modal or popover background |
| `--color-border-subtle` | `#27272A` | Restrained 1px structural outlines |
| `--color-border-strong` | `#3F3F46` | Focused inputs, distinct outlines |
| `--color-ink-primary` | `#EDEDEC` | Primary text and headlines |
| `--color-ink-secondary` | `#A1A1AA` | Body copy and descriptions |
| `--color-ink-muted` | `#71717A` | Subtext and secondary labels |
| `--color-accent` | `#EDEDEC` | Crisp white/off-white contrast button |
| `--color-accent-hover` | `#FFFFFF` | Action hover |

---

## 3. Typography

Typography is Sift's primary interface medium. We pair a refined editorial serif for titles and discovery moments with an ultra-legible neutral sans for dense information display.

### Font Stacks
- **Display / Editorial Serif**: `"Newsreader", "Instrument Serif", "Georgia", "Times New Roman", serif`
- **UI / Body Sans**: `"Geist Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- **Data / Metadata Mono**: `"Geist Mono", "JetBrains Mono", "SF Mono", monospace`

### Typographic Scale
| Level | Font Family | Size | Weight | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display-lg` | Serif | 2.5rem (40px) | 400 (Normal) | 1.15 | `-0.02em` |
| `display-md` | Serif | 1.875rem (30px)| 400 (Normal) | 1.2 | `-0.015em` |
| `headline` | Sans | 1.25rem (20px) | 500 (Medium) | 1.35 | `-0.01em` |
| `body` | Sans | 0.9375rem (15px)| 400 (Normal) | 1.55 | `0` |
| `body-sm` | Sans | 0.8125rem (13px)| 400 (Normal) | 1.5 | `0` |
| `metadata` | Mono | 0.75rem (12px) | 400 / 500 | 1.4 | `+0.02em` |

---

## 4. Components & Layout Rules

### 1. The Job Card (List Item)
- **Border**: Single `1px solid var(--color-border-subtle)`.
- **Shadow**: None or subtle `0 1px 2px rgba(0, 0, 0, 0.03)`.
- **Padding**: `16px 20px` (ample breathing room).
- **Interactions**: Subtle border tint on hover (`var(--color-border-strong)`), no bouncy transforms or scale effects.
- **Badges**: Minimalist text badges with hairline border and zero shadow. No candy-colored pills.

### 2. Search & Command Bar
- Calm, wide input field with warm surface background.
- Clear natural language placeholder: *"e.g. Founding distributed systems engineer at Series A startup with salary > $180k"*
- Clean keyboard shortcuts indicator in monospace (`⌘K` or `/`).

### 3. Apply Link & Attribution
- Sift is an indexer, not a walled garden.
- Every posting clearly surfaces its origin ATS (`Greenhouse`, `Lever`, `Ashby`, etc.) and company career site.
- The apply button directs immediately to the canonical career URL with all tracking bloat stripped.

---

## 5. Crawler Ethics & Politeness Protocol

Every crawler component in Sift adheres to strict behavioral standards:

1. **User-Agent Identification**:
   - `SiftBot/1.0 (+https://siftjobs.com/bot; crawler@siftjobs.com)`
2. **Robots.txt Adherence**:
   - Every domain's `robots.txt` must be fetched, parsed, and cached.
   - Any path disallowed for `*` or `SiftBot` is strictly skipped.
3. **Domain Rate Limiting**:
   - Minimum delay between requests to the same host: `1.5 seconds` (or as specified by `Crawl-delay` in robots.txt).
   - Maximum concurrency per host: `1 request`.
4. **Permanent Domain Blacklist**:
   - **Never scrape LinkedIn, Indeed, Glassdoor, or closed networks.**
   - Sift only indexes publicly available company career endpoints and official ATS job boards (e.g. `boards-api.greenhouse.io`, `api.lever.co`, `api.ashbyhq.com`).
