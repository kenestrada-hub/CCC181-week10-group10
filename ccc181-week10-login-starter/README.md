# CCC181 Week 10: CampusConnect Mobile-First Login Page

React + TypeScript starter for the Week 10 group activity. The page is already
built. Your group's job is the **mobile-first CSS** and the **GitHub teamwork**.

## Run it

```bash
npm install
npm run dev          # open the local URL it prints
npm run dev:phone    # same, but your phone (same Wi-Fi) can open the Network URL
npm run build        # must finish with no errors before you submit
```

## Rules

- Edit only the CSS files in `src/styles/` (one member = one file). Do not edit `reset.css`.
- Plain CSS only. No Tailwind, Bootstrap, Material UI, styled-components, or any UI library.
- Phone styles first (no media query), then `min-width` queries only. Never `max-width`.
- Do not edit the `.tsx` files or rename classes. If you must, tell the group first.

## Group information (fill in)

| Item | Your answer |
| --- | --- |
| Group number | 10 |
| Section | IT-3A |
| Repository URL | https://github.com/kenestrada-hub/CCC181-week10-group10 |

## Members (each member fills in their own row in their own commit)

| Member | Name | GitHub username | CSS file | What I did |
| --- | --- | --- | --- | --- |
| 1 (leader) | Ken Estrada | kenestrada-hub | `base.css` | Added the viewport meta tag after Experiment 0. Built the mobile-first page and container layout, centered navy brand panel and gold pill badge on phones, wider padding from 768px, two-column login with visible perks from 1024px, and centered 1200px containers from 1280px. |
| 2 | Jeroul Palomo | pronehacker99 | `nav.css` | Navbar with Flexbox: brand on top and stacked 48px links on phones, brand left and links in one row from 768px. Footer with Grid: 1 column on phones, 3 equal columns from 1024px. Hover and focus-visible styles on every nav and footer link. My screenshots: `screenshots/pronehacker99/`. |
| 3 | Felmar Troy Magsayo | FelmarTroy | `form.css` | Wrote the mobile-first login-card styles in plain CSS: stacked 48px tap targets on phones, password row with Show button that never overflows at 360px, checkbox + link in a row from 768px, side-by-side alt buttons from 768px, larger card padding and title from 1024px. Every :hover paired with :focus-visible; all sizing in rem/%; px only for thin borders and 48px tap-target heights. Added `overflow-wrap: anywhere` on .form-success so a long email can't cause sideways scrolling. |

## Experiment 0: the page without the viewport tag

What did the page look like in DevTools phone mode **before** adding the viewport meta tag?
What changed **after** adding it?

> Before the viewport tag, iPhone SE emulation showed a zoomed-out, tiny page. Both `window.innerWidth` and `document.documentElement.scrollWidth` were 981px instead of 375px. After adding `width=device-width, initial-scale=1`, the page used its real 375px width at normal scale, with no horizontal overflow.

## DevTools test results

| Width | What must be true | Pass? |
| --- | --- | --- |
| 360 px | 1 column. Nav links stacked and 48px tall. Options and buttons stacked. Footer in 1 column. No sideways scrollbar. | Pass |
| 768 px | Nav in one row (brand left, links right). Checkbox and link in one row. Two buttons side by side. | Pass |
| 1024 px | Brand panel and login card side by side. Footer in 3 columns. Heading is larger. | Pass |
| 1280 px | Content centered and stops at 1200px. | Pass |

### Breakpoints I observed

Using **Show media queries** and dragging slowly from 360 px to 1280 px, the layout changed at these exact widths:

> The layout changed at exactly 768px (wider padding and single-row navigation/form actions), 1024px (two-column login, larger brand heading, visible perks, and three-column footer), and 1280px (centered 1200px containers). Nothing looked broken at 360, 768, 1024, or 1280px; every test passed without sideways scrolling.

Screenshots are in `screenshots/` as `360.png`, `768.png`, `1024.png`, `1280.png`.

## What our group learned (leader writes this last)

> We learned how the viewport meta tag controls mobile layout width, how to build mobile-first CSS with `min-width` breakpoints, and how Flexbox and Grid solve different layout needs. We also practiced scoped file ownership, explicit Git staging, small focused commits, pull-request reviews, and merge commits while testing our combined work at every breakpoint.
