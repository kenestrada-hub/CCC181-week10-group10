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
| Group number | |
| Section | |
| Repository URL | |

## Members (each member fills in their own row in their own commit)

| Member | Name | GitHub username | CSS file | What I did |
| --- | --- | --- | --- | --- |
| 1 (leader) | | | `base.css` | |
| 2 | PapsiProne | pronehacker99 | `nav.css` | Navbar with Flexbox: brand on top and stacked 48px links on phones, brand left and links in one row from 768px. Footer with Grid: 1 column on phones, 3 equal columns from 1024px. Hover and focus-visible styles on every nav and footer link. My screenshots: `screenshots/pronehacker99/`. |
| 3 | Felmar Troy Magsayo | FelmarTroy | `form.css` | Wrote the mobile-first login-card styles in plain CSS: stacked 48px tap targets on phones, password row with Show button that never overflows at 360px, checkbox + link in a row from 768px, side-by-side alt buttons from 768px, larger card padding and title from 1024px. Every :hover paired with :focus-visible; all sizing in rem/%; px only for thin borders and 48px tap-target heights. Added `overflow-wrap: anywhere` on .form-success so a long email can't cause sideways scrolling. |

## Experiment 0: the page without the viewport tag

What did the page look like in DevTools phone mode **before** adding the viewport meta tag?
What changed **after** adding it?

> (write your answer here)

## DevTools test results

| Width | What must be true | Pass? |
| --- | --- | --- |
| 360 px | 1 column. Nav links stacked and 48px tall. Options and buttons stacked. Footer in 1 column. No sideways scrollbar. | |
| 768 px | Nav in one row (brand left, links right). Checkbox and link in one row. Two buttons side by side. | |
| 1024 px | Brand panel and login card side by side. Footer in 3 columns. Heading is larger. | |
| 1280 px | Content centered and stops at 1200px. | |

### Breakpoints I observed

Using **Show media queries** and dragging slowly from 360 px to 1280 px, the layout changed at these exact widths:

> (write the widths here, and say whether any width looked broken)

Screenshots are in `screenshots/` as `360.png`, `768.png`, `1024.png`, `1280.png`.

## What our group learned (leader writes this last)

> (write your answer here)
