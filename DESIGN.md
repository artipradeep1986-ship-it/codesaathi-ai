# CodeSaathi AI — Design System

## Brand
- **Name:** CodeSaathi AI
- **Tagline:** From Notebook to Output.
- **Tone:** Friendly, encouraging, student-focused

## Colors
| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#FFFFFF` | Page background |
| `--bg-soft` | `#F3F8FF` | Cards, soft areas |
| `--primary` | `#2563EB` | Buttons, links, accents |
| `--primary-dark` | `#1D4ED8` | Pressed / hover state |
| `--primary-light` | `#DBEAFE` | Primary backgrounds |
| `--text` | `#0F172A` | Headings, body |
| `--text-secondary` | `#475569` | Secondary text |
| `--text-muted` | `#94A3B8` | Placeholders |
| `--success` | `#16A34A` | Success states |
| `--success-bg` | `#F0FDF4` | Success backgrounds |
| `--warning` | `#F59E0B` | Uncertain OCR |
| `--warning-bg` | `#FFFBEB` | Warning backgrounds |
| `--error` | `#DC2626` | Errors |
| `--error-bg` | `#FEF2F2` | Error backgrounds |
| `--border` | `#E2E8F0` | Borders |
| `--border-focus` | `#2563EB` | Focus rings |

## Dark Mode (Optional)
| Token | Value |
|-------|-------|
| `--bg` | `#0F172A` |
| `--bg-soft` | `#1E293B` |
| `--text` | `#F1F5F9` |
| `--text-secondary` | `#94A3B8` |
| `--border` | `#334155` |

## Typography
- **Font:** System stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Code font:** `'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace`
- **Body:** 16px / 1.5 line-height
- **H1:** 24px / bold
- **H2:** 20px / semibold
- **H3:** 18px / semibold
- **Small:** 14px
- **Code:** 14px monospace

## Spacing
- `xs: 4px`
- `sm: 8px`
- `md: 12px`
- `lg: 16px`
- `xl: 24px`
- `2xl: 32px`
- `3xl: 48px`

## Radii
- `sm: 8px`
- `md: 12px`
- `lg: 16px`
- `full: 9999px`

## Shadows
- `sm: 0 1px 2px rgba(0,0,0,0.05)`
- `md: 0 4px 6px -1px rgba(0,0,0,0.07)`
- `lg: 0 10px 15px -3px rgba(0,0,0,0.08)`

## Components
- **Buttons:** min 48×48px tap target, rounded-lg, font-medium
- **Cards:** bg-white/bg-soft, rounded-xl, shadow-sm, p-4
- **Chips:** rounded-full, px-3 py-1, font-medium
- **Inputs:** rounded-lg, border, h-12, px-4
- **Bottom Nav:** fixed, h-16, 4 tabs, active = primary

## Breakpoints
- `sm: 640px`
- `md: 768px` (tablet)
- `lg: 1024px` (desktop)
- `xl: 1280px` (wide)

## Motion
- Duration: 150-200ms
- Easing: ease-out
- Respect `prefers-reduced-motion`
