# Design

Old-money ledger. Paper, ink, hairlines. Not a SaaS dashboard.

## Tokens

| Token         | Value     | Use                      |
| ------------- | --------- | ------------------------ |
| `--bg`        | `#F7F5F0` | Page                     |
| `--surface`   | `#FFFFFF` | Inputs, overlays         |
| `--line`      | `#E4E0D6` | Dividers                 |
| `--ink`       | `#1A1A17` | Text                     |
| `--ink-muted` | `#6B675E` | Labels                   |
| `--primary`   | `#0E3A5B` | Navy actions, active nav |
| `--accent`    | `#9A7B4F` | Brass, rare emphasis     |
| `--available` | `#2F5D46` | Available                |
| `--sold`      | `#7A2E2A` | Sold / error             |

Radius 2–4px. 4px spacing scale. Row height 32px.

## Typography

- Geist — UI
- Geist Mono — unit codes
- Newsreader — headings and big numbers only

Numbers are `tabular-nums` and right-aligned. PKR compact form uses lakh / crore.

## Motion

150–200ms, ease-out. No bounce, no spring showpieces.

## Component rules

- Hairline dividers, not cards.
- Icons only in navigation (`@phosphor-icons/react`, `weight="light"`).
- Forms: label + input, 32px controls, visible focus ring.

## Bans

No gradients, shadows, card boxes, emoji, rainbow colours, purple, Lucide, Recharts, default shadcn styling, Inter/Roboto as the brand face.

## References

- `src/styles/tokens.css`
- Vercel Web Interface Guidelines (keyboard, focus, hit targets)
- Anthropic frontend-design skill (distinctive, not templated) — applied here as a ledger, not a cream-and-terracotta marketing page
