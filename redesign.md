# redesign.md — One Design for Staff, Manager and Client

> **Scope: Client tab only.** Use this file only when designing/building the Client app (`src/components/client/`). Do not read or apply it for Staff or Manager work.

Staff and Manager are the **source of truth** for design. Client must look identical to them: same theme, same colors, same fonts, same controls, same cards. The only things that differ between roles are content and permissions, never visuals.

> Source of truth = what the Staff/Manager screens actually ship (`#2F68FE`, `#1E293B`, `#EBF0F7`).
> `design-system/tokens.ts` (`#0F172A`, `#2563EB`) and the slate-900 buttons in `MobilePrimitives.tsx` (`StickyBottomAction`, `EmptyState`, `SegmentedControl`) are **not used by any shipped screen**. Do not copy them.

**Restyle only.** Applying this document changes appearance, never content or behavior. Every label, placeholder, message, number, data value, button, link, icon-with-meaning, handler, navigation, validation, permission check and design-version switch (V1/V2/V3) stays exactly as it is. Re-skinning means swapping classes / wrapper markup so the same elements look like Staff/Manager. If a visual change would force a text or functionality change (an element removed, merged, reordered in a way that changes behavior, or a flow altered), **stop and ask; change it only after the user says "OK".** Where this document says "no hero / no gradient / white header", keep the element's text, buttons and actions and only flatten how it looks.

All class strings below are Tailwind v4 as used in Staff/Manager. Reuse the shared components (`design-system/*`, `common/*`, `client/staff/tabs/StaffTabParts.tsx`) before writing new markup.

---

## 1. Design style

- Clean, light-only, enterprise SaaS. No dark mode.
- **One blue** (`#2F68FE`) is the only brand color. Everything else is slate neutrals plus a small semantic set (amber / green / rose) for status.
- **Flat and quiet.** White cards on a pale canvas, hairline borders, almost no shadow. Depth comes from borders and spacing, not from glows, gradients or color blocks.
- Rounded, friendly geometry: 12px controls, 16px cards, 28px sheets, full-round pills and avatars.
- Compact, dense type (mostly 11–14px) with bold titles and light grey meta text.
- Thumb-first: 44px touch targets, 48px primary CTAs, sticky bottom action bar, bottom sheets for every picker and filter.
- Color is used for **meaning** (status, actionable, selected), never for decoration or per-category theming.

---

## 2. Colors

### 2.1 Brand and interactive

| Role | Value | Use |
|---|---|---|
| Primary | `#2F68FE` | Primary buttons, links, selected state, active tab / nav, focus border, actionable icons, count badges |
| Primary pressed | `#1D4ED8` | `active:` state of primary buttons |
| Primary tint | `#EFF6FF` (`bg-blue-50`) | Selected rows, soft pills, info panels, active filter button |
| Primary tint border | `#BFDBFE` / `border-blue-100` | Border of tinted panels and icon tiles |
| Focus ring | `ring-4 ring-blue-50` + `border-[#2F68FE]` | Every focused input / dropdown |
| Indigo accent | `#4F46E5` on `#EEF2FF` | Secondary accent only: small pill actions (e.g. Quick Fill), "in review" style states, section icon tile background `#EEF2FF` |

### 2.2 Text

| Role | Value | Use |
|---|---|---|
| Primary text | `#1E293B` | Titles, values, names, form labels. **The only dark text color.** |
| Body / menu text | `slate-700` | Menu items, secondary buttons |
| Secondary text | `slate-600` / `slate-500` | Sub-lines, field labels in grids, inactive tabs |
| Meta / tertiary | `slate-400` | Timestamps, hints, counters, placeholders, neutral icons |
| Link / action text | `#2F68FE` | "View all", "Clear", "Show more" |
| On-primary text | `#FFFFFF` | Text on `#2F68FE` / `#10B981` fills only |

### 2.3 Backgrounds and surfaces

| Role | Value |
|---|---|
| Screen canvas | `#F8FAFC` — every screen root: `bg-[#F8FAFC] text-[#1E293B]` |
| Surface (card, header, nav, sheet) | `#FFFFFF` |
| Muted panel inside a card | `bg-slate-50` (`#F8FAFC`) with `border-slate-100`; inset summary may use `bg-slate-50/80` |
| Muted fill (segmented track, neutral chip, empty icon tile) | `bg-slate-100` (`#F1F5F9`) |
| Search input fill | `bg-slate-50`, becomes `bg-white` on focus |
| Overlay / backdrop | `bg-slate-900/50` to `/60` + `backdrop-blur-xs` |

### 2.4 Borders and dividers

| Role | Value |
|---|---|
| Card, header, bottom nav, sticky bar border | `#EBF0F7` (inner list cards may use `border-slate-100`) |
| Inside-card divider / list divider | `border-slate-100` / `divide-slate-100` |
| Form control border (input, dropdown, choice tile, date field) | `border-slate-200` (`#E2E8F0`) |
| Error border | `border-rose-300` |

### 2.5 Status colors (the only allowed semantic palette)

Chips are `rounded-full px-2.5 py-0.5 text-[11px] font-bold` (optionally a 12px icon before the label).

| Meaning | Background | Text | Notes |
|---|---|---|---|
| Pending / waiting / action needed | `#FEF8E7` | `#D97706` | border `amber-200/50` when shown with icon |
| Approved / completed / success / available | `#E8F8F0` | `#10B981` | border `emerald-200/50` |
| Rejected / failed / overdue / critical | `#FEF2F2` | `#EF4444` | border `rose-200/50`; destructive text/buttons use `rose-600` |
| Info / active / selected | `#EFF6FF` | `#2F68FE` | |
| Secondary state (e.g. "In review") | `#EEF2FF` | `#4F46E5` | |
| Violet state (special pending counts) | `#F5F3FF` | `#7C3AED` | rare |
| Neutral / draft / inactive | `bg-slate-100` | `slate-600` | |

KPI number tiles (count above a label): success `#E8F8F0/#10B981`, danger `#FDECEC/#F43F5E`, warning `#FEF8E7/#F59E0B`, info `#EFF6FF/#2F68FE`.
Alert banners: tone-50 background + tone-100/200 border + tone-600/700 text (blue, amber, rose, emerald). Example: rose alert `#FFF1F2` + `#FECDD3`.
Notification badge: `bg-rose-500 text-white text-[9px] font-bold ring-2 ring-white`.

### 2.6 Avatar tints (rotate by index)

`bg-rose-50 text-rose-600` · `bg-blue-50 text-blue-600` · `bg-violet-50 text-violet-600` · `bg-emerald-50 text-emerald-600` · `bg-amber-50 text-amber-700` · `bg-sky-50 text-sky-600` — use `avatarTint(index)` and `initialsOf(name)` from `home/celebrationUtils`.

### 2.7 Gradients and glows

Only these exist in Staff/Manager and only these are allowed:
- Side-drawer header wash: `bg-linear-to-br from-[#EEF2FF] via-white to-[#F5F3FF]` (+ the two soft blurred circles) and the drawer avatar ring (`from-amber-200 via-rose-200 to-violet-300`).
- Progress bar fill: `bg-linear-to-r from-[#2F68FE] to-[#6366F1]`.
- Fade-out overlay `from-white to-transparent`.

Everything else is **flat solid color**. No gradient buttons, icon tiles, hero cards, headers, chips, or avatars. No colored shadows (`rgba(47,104,254,…)` glows).

---

## 3. Typography

- **Font:** Plus Jakarta Sans (400–700), fallback system sans. Caveat 600 only for signatures. Nothing else.
- Numbers in lists, KPIs, dates and amounts use `tabular-nums`.
- Minimum size 10px. Prefer the whole-pixel scale below; avoid 10.5 / 11.5 / 12.5.

| Style | Size / weight | Color | Where |
|---|---|---|---|
| Screen title | `text-base` 16 / bold, centered | `#1E293B` | Screen header (`.screen-title`) |
| Greeting name | `text-2xl` 24 / extrabold | `#1E293B` | Dashboard only |
| Greeting line, date | `text-sm` / medium · `text-xs` / semibold | slate-600 | Dashboard |
| Sheet title | `text-base` / bold | `#1E293B` | Bottom sheets |
| Section title | `text-sm` 14 / bold | `#1E293B` | "Leave Requests", card headings |
| Card title / primary line | `text-sm` / bold | `#1E293B` | Date range, name |
| Form label | `text-xs` 12 / bold | `#1E293B` | Above inputs |
| Compact label (paired fields) | `text-[11px]` / semibold | slate-500 | "From Date" |
| Body / value / control text | `text-xs` 12 / medium (semibold when emphasized) | `#1E293B` or slate-700 | Rows, inputs, menus |
| Search / sheet option text | `text-[13px]` / medium | `#1E293B` / slate-700 | Search field, option lists |
| Meta / helper | `text-[11px]` / normal–medium | slate-400 / slate-500 | Timestamps, "Applied on…", hints |
| Micro | `text-[10px]` / medium–bold | slate-400 | Nav labels, counters, sub-hints |
| KPI number | `text-base`–`text-lg` / extrabold | `#1E293B` or status color | Balances, counts |
| Button | `text-xs` 12 / bold | white / `#2F68FE` | All buttons (compact buttons `text-[11px]` bold) |
| Chip | `text-[11px]` / bold | status color | Status chips |

---

## 4. Spacing, radius, shadow, icons

**Spacing**
- Screen horizontal padding `px-4`; scroll area `pt-3.5` to `pt-4`, bottom `pb-20` when a sticky bar exists, else `pb-6`/`pb-8`.
- Vertical rhythm: sections `space-y-4`; cards in a list `space-y-3` (or `3.5`); inside a card `space-y-3`.
- Card padding `p-4` (dense `p-3.5`); sheet padding `px-5`; form field stack `space-y-4`/`5`; paired fields `grid grid-cols-2 gap-3`.
- Touch targets: controls and filter button 44px (`h-11`), primary CTA 48px (`h-12`), icon buttons `w-9 h-9`, compact in-card buttons `h-9`.

**Radius**
- Controls, buttons, dropdown options: `rounded-xl` (12px)
- Cards, empty states, menus, grouped lists: `rounded-2xl` (16px)
- Manager team cards and KPI cards: `rounded-[20px]`
- Bottom sheet: `rounded-t-[28px]`; side drawer: `rounded-r-[28px]`
- Modal: `rounded-3xl`
- Pills / avatars / status chips / icon buttons: `rounded-full`
- Inline tag (e.g. Reason): `rounded-md`; segmented thumb: `rounded-xl`/`rounded-lg`

**Shadow**
- Cards and form controls: `shadow-2xs`
- Team/KPI cards: `shadow-[0_2px_8px_rgba(0,0,0,0.03)]`
- Sticky bottom bar: `shadow-[0_-4px_20px_rgba(0,0,0,0.05)]`; bottom nav: `shadow-[0_-4px_16px_rgba(15,23,42,0.04)]`
- Popover/menu: `shadow-[0_16px_40px_-12px_rgba(15,23,42,0.28)]`
- Bottom sheet `shadow-2xl`; modal `shadow-xl`; drawer `shadow-[12px_0_40px_-12px_rgba(15,23,42,0.45)]`
- Nothing else. No blue / colored shadows.

**Icons**
- `lucide-react` only. Sizes `w-4 h-4` inline, `w-5 h-5` in headers/buttons, `w-5.5` in nav. Stroke default (1.8–2.2 for header/nav).
- Neutral icons `text-slate-400`; actionable/primary icons `text-[#2F68FE]`. Icon in a tile: `w-8–11` square, `rounded-xl`, `bg-[#EEF2FF]` or `bg-blue-50 border border-blue-100`, icon `#2F68FE`. One tile style, one color — no per-category rainbow tiles.

---

## 5. App shell (already identical in Client — keep it)

- **App header:** `h-14 bg-white/95 backdrop-blur-md border-b border-[#EBF0F7]`; menu button left, horizontal logo, bell with rose badge, avatar with `ring-2 ring-white`.
- **Screen header:** `h-14 bg-white border-b border-[#EBF0F7]`; round back button `w-9 h-9` with `ArrowLeft w-5`; title centered `text-base font-bold` via `.screen-title`. White — never blue, never a hero.
- **Bottom nav:** `h-16`, 4 tabs, `bg-white border-t border-[#EBF0F7]`; active icon + label `#2F68FE` with icon fill `#2F68FE/15`, inactive `slate-400`, label `text-[10px]`.
- **Side drawer:** `w-[84%] max-w-[330px] bg-[#F8FAFC] rounded-r-[28px]`; gradient wash header, profile card, search, white module list; active item `#2F68FE` bold, rows `h-12 rounded-xl`.
- Screen transitions: `ScreenTransition` slide by depth. Respect `prefers-reduced-motion`.
- **No breadcrumbs** on any screen.

---

## 6. Components

### 6.1 Buttons
| Type | Classes |
|---|---|
| Primary | `h-12 rounded-xl bg-[#2F68FE] text-white text-xs font-bold shadow-xs active:bg-[#1D4ED8] transition-colors cursor-pointer` (`w-full` in forms; `disabled:opacity-60`) |
| Secondary (outline) | `h-12 rounded-xl border border-[#2F68FE] text-[#2F68FE] text-xs font-bold bg-white active:bg-blue-50` |
| Clear / ghost text | `text-[#2F68FE] font-bold text-xs active:bg-blue-50/50` (or `text-[11px] font-semibold` inline) |
| Destructive (outline) | `h-9 px-3.5 rounded-xl border border-rose-200 text-rose-600 text-[11px] font-bold active:bg-rose-50` |
| Approve (solid) | `h-9 px-3.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold active:bg-emerald-700` |
| Pill action | `h-8 px-2.5 rounded-full bg-indigo-50 text-[#4F46E5] text-[11px] font-semibold active:bg-indigo-100` |
| Icon button | `w-9 h-9 rounded-full text-slate-600 active:bg-slate-100` |
| Sticky action bar | `sticky bottom-0 p-4 bg-white/95 backdrop-blur-md border-t border-[#EBF0F7] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20` holding one primary CTA (or a 2-column Clear / Apply pair) |

One primary button per screen state. No dark (slate-900 / `#0F172A`) buttons, no gradient buttons, no buttons colored per module.

### 6.2 Form controls
- **Label:** `block text-xs font-bold text-[#1E293B]`; required `*` in `text-rose-500`; optional hint `(Optional)` in `text-slate-400 font-medium`.
- **Text / date / select trigger:** `w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-[#1E293B] placeholder:text-slate-400 shadow-2xs`.
  Focus / open: `border-[#2F68FE] ring-4 ring-blue-50`. Error: `border-rose-300` + `text-[11px] font-medium text-rose-500` message below.
- **Textarea:** `p-3.5 … rounded-xl resize-none`, character counter bottom-right `text-[10px] text-slate-400`.
- **Date field:** control with `Calendar w-4 h-4 text-[#2F68FE]`, placeholder value `text-slate-400`; opens `DateWheelSheet` / `DatePickerSheet`.
- **Search field:** `h-11 pl-10 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium`, search icon `text-slate-400` at left, clear X at right; focus → `bg-white border-[#2F68FE] ring-4 ring-blue-50`.
- **Dropdown (`design-system/Dropdown`):** menu `bg-white border border-slate-200/80 rounded-2xl p-1.5` + popover shadow; option `min-h-10 px-3 rounded-xl text-xs`; selected `bg-blue-50 text-[#2F68FE] font-bold` + check icon. More than 6 options → bottom sheet with search.
- **Choice tiles (`common/ChoiceTiles`):** `h-11 px-3 rounded-xl border text-xs`; off `border-slate-200 bg-white text-slate-600`; on `border-[#2F68FE] bg-blue-50/70 font-semibold`. Checkbox `rounded-md border-2` (on: filled `#2F68FE` + white check); radio `rounded-full border-2` with inner dot.
- **Toggle:** `w-10 h-6 rounded-full`, on `#2F68FE`, off `slate-300`.
- **Upload:** use the shared `MultiFileUploadField` / `FileUploadField` look.

### 6.3 Tabs and segmented controls
- **Underline tabs** (profile-style): `h-12 px-3 text-[13px] font-medium`; active `text-[#2F68FE]` with `absolute left-2 right-2 bottom-0 h-[3px] rounded-t-full bg-[#2F68FE]`; inactive `text-slate-500`; row sits on white with `border-b border-[#EBF0F7]`; horizontal scroll, `no-scrollbar`.
- **Segmented (`SegmentedTabs`):** track `p-1 rounded-2xl bg-slate-100/90 border border-slate-200/60`; item `h-9 rounded-xl text-xs`; active `bg-white text-[#1E293B] font-bold shadow-[0_1px_3px_rgba(15,23,42,0.12)]`; inactive `text-slate-500 font-semibold`; count badge active `bg-[#2F68FE] text-white`, inactive `bg-slate-300/70 text-slate-600`.
- **Filter chips:** `h-8 px-3 rounded-full border text-[11px] font-semibold`; on `bg-[#2F68FE] border-[#2F68FE] text-white`; off `bg-white border-slate-200 text-slate-600`; count bubble `min-w-5 h-5 rounded-full text-[10px] font-bold`.

### 6.4 Filters
- Trigger: `FilterIconButton` — `w-11 h-11 rounded-xl border shadow-2xs`, funnel icon `#2F68FE`; applied state `bg-blue-50 border-[#2F68FE]` + count badge (`bg-[#2F68FE] text-white text-[10px] font-bold ring-2 ring-[#F8FAFC]`) at top-right. It sits right-aligned in the section header row next to the list title.
- Sheet: titled "Filter …"; body sections with `text-xs font-bold` labels, dropdown / multi-select / `DateRangeFields`; footer `grid grid-cols-2 gap-3` = **Clear All** (outline) + **Apply Filters (n)** (primary).
- Active filters are summarized by the badge count (or a `TeamFilterBar` row), not by colorful chip rows.

### 6.5 Bottom sheet
- Backdrop `bg-slate-900/60 backdrop-blur-xs`; panel `bg-white rounded-t-[28px] shadow-2xl`, `max-h-[92%]` (85% / 80% for short sheets).
- Drag handle `w-10 h-1 bg-slate-300 rounded-full` (`pt-3 pb-1`, centered).
- Header `px-5 pt-1 pb-3 border-b border-slate-100`: title `text-base font-bold`, optional `text-[11px] text-slate-400` subtitle, close `w-8 h-8 rounded-full text-slate-400` with `X w-5`. A leading `w-10 h-10 rounded-xl` icon tile is allowed (tinted by meaning).
- Body `px-5 py-4 space-y-4/5 overflow-y-auto no-scrollbar`; footer `border-t border-slate-100 p-4 pb-6` (or `p-5 pb-8`), buttons per 6.1.

### 6.6 Modal / dialog
Overlay `bg-slate-900/50 backdrop-blur-xs px-6`; panel `bg-white rounded-3xl p-5 shadow-xl`; title `text-base font-extrabold` centered; success mark = `w-16 h-16 rounded-full bg-[#10B981]` with white check and `ring-8 ring-emerald-50`; confirm dialogs use the same panel with outline + primary (or destructive) button pair.

### 6.7 Menu / popover (⋯ actions)
`w-44 bg-white border border-slate-200/80 rounded-2xl p-1.5` + popover shadow; item `h-10 px-3 rounded-xl text-xs font-semibold text-slate-700 gap-2.5 active:bg-slate-50` with `w-4 h-4 text-slate-400` icon; destructive item `text-rose-600 active:bg-rose-50` after a `border-t border-slate-100` divider. Trigger: `w-7 h-7 rounded-full text-slate-400`, open `bg-blue-50 text-[#2F68FE]`.

### 6.8 Badges, pills, tags
- Status chip: see 2.5.
- Soft tag (e.g. Reason value): `px-2 py-0.5 rounded-md bg-blue-50 text-[#2F68FE] text-[11px] font-semibold`.
- Count pill beside a title: `px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2F68FE] text-[11px] font-bold`.
- Role badge: `px-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide` (Client: `bg-blue-100 text-[#2F68FE]`).

### 6.9 Avatars
Initials: `w-10 h-10 rounded-full text-xs font-bold` (list header) or `w-8 h-8 … text-[10px]` (compact) using the 6 tints. Generic person: `w-7 h-7 rounded-full bg-slate-100 text-slate-500` with `User w-3.5`. Photos: `ProfileAvatar`. No colored gradient or colored-by-category avatars.

### 6.10 Empty / loading / error
- Empty: `bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-500`, message `text-xs font-medium`, optional "Clear Filter" `text-xs font-semibold text-[#2F68FE]`. Richer variant: `w-14 h-14 rounded-2xl bg-slate-100 text-slate-400` icon tile, `text-sm font-bold` title, `text-xs` description.
- Loading: neutral skeleton blocks `rounded-lg bg-slate-200/70 animate-pulse` inside normal white cards.
- Error / warning inline: tone-50 panel with tone-100 border (6.2 / 2.5).
- Success: modal (6.6) or toast; no colored full-width banners.

---

## 7. Cards

Every card is **white on the `#F8FAFC` canvas** with a hairline border. Never tint a card's background to signal category.

### 7.1 Base card
`bg-white border border-[#EBF0F7] rounded-2xl p-4 shadow-2xs space-y-3` (dense: `p-3.5`). Tappable: add `cursor-pointer active:bg-slate-50`. Grouped list inside a card: `rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden`.

### 7.2 Record / request card (Staff pattern — default for any list item)
1. **Top row** `flex items-start justify-between gap-3`: title `text-sm font-bold` (+ `text-xs text-slate-500 font-medium` sub-line) on the left; status chip + optional ⋯ button on the right.
2. `border-t border-slate-100` divider.
3. **Detail rows** `text-[11px]`: label `text-slate-500 font-medium` + value (plain `font-semibold #1E293B`, or soft blue tag). For many fields use label/value pairs: label `text-[11px] text-slate-400`, value `text-xs font-semibold text-[#1E293B] tabular-nums`, 2-column grid (`gap-x-4 gap-y-3`); long values span the row; empty values hidden.
4. **Footer row**: `w-7 h-7` person icon/avatar + name `text-xs font-bold` / role `text-[10px] text-slate-400` on the left, meta (`Applied on …`, `text-[11px] text-slate-400`) on the right.

### 7.3 Person / team card (Manager pattern — for people lists and reviews)
`bg-white border border-[#EBF0F7] rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden`
- Header `p-3.5`: avatar `w-10 h-10` + name `text-sm font-bold` / sub `text-[11px] text-slate-400` + status chip.
- Summary panel `mx-3.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100` (key value + big number `text-base font-extrabold` with `text-[10px] text-slate-400` unit).
- Footer `px-3.5 py-2.5 border-t border-slate-100`: ghost link left (`text-[11px] font-bold text-[#2F68FE]` + chevron), action buttons right (Reject outline-rose, Approve emerald-600).

### 7.4 KPI / balance card
- Balance: `bg-white border border-[#EBF0F7] rounded-2xl p-4 shadow-2xs`, title `text-sm font-bold`, 3-column grid `divide-x divide-slate-100`; each cell label `text-xs font-semibold text-slate-500`, value `text-base font-extrabold` + unit `text-xs font-bold text-slate-700`, sub `text-[11px] text-slate-400`.
- Count tiles: card `rounded-[20px]`, 3-up grid, number in `w-14 h-9 rounded-lg` status-tinted tile (`text-lg font-bold`), label `text-xs text-gray-500 font-medium` below; optional `border-t border-[#F1F5F9]` footer with expand row.

### 7.5 Dashboard section card
`bg-white border border-[#EBF0F7] rounded-2xl p-4 shadow-2xs`: header = `w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#2F68FE]` icon tile + `text-sm font-bold` title, right-aligned "View all →" (`text-[11px] font-semibold text-[#2F68FE]`). Rows `py-2.5 border-b border-slate-100` (last row no border): leading value tile `w-8 h-8 rounded-xl text-sm font-extrabold`, title `text-xs font-semibold text-slate-700`, sub `text-[11px] text-slate-400`, trailing chevron `#2F68FE`.

### 7.6 Summary header card (forms / detail)
Card with `w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-[#2F68FE]` icon tile, title `text-base font-bold`, sub `text-xs text-slate-500`, then `border-t border-slate-100` footer line with `text-xs` label/value (value `font-bold`, highlighted number `#2F68FE`).

### 7.7 Notice panels (inside screens)
Info `p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-[#2F68FE]`; neutral `p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl text-xs`; other tones follow 2.5. Text-only, no heavy fills.

---

## 8. Screen templates

**List screen:** screen header → (underline tabs or segmented control if the module has views) → scroll area `px-4 pt-3.5 pb-20 space-y-4` → optional balance/KPI card → section row (title `text-sm font-bold` + count pill, `FilterIconButton` at right) → cards `space-y-3` → empty state → sticky primary-CTA bar if the screen creates something.

**Detail screen:** white screen header with back → summary header card (7.6) → sections as base cards with `text-xs font-bold` headings → label/value grid (7.2) → sticky action bar when actions exist. No blue/colored header block, no hero.

**Form screen:** white header → summary card → field groups (`space-y-4`, labels per 6.2, pickers open as bottom sheets) → sticky bottom primary CTA, disabled until valid → success modal (6.6).

**Dashboard:** plain greeting on the canvas (name `text-2xl font-extrabold #1E293B`, date on the right in slate), then white section cards (7.5) and KPI cards (7.4). No gradient hero, no white-on-blue banner.

**Sheet-based flow:** pickers, filters, reviews, comments, confirmations are bottom sheets (6.5), never new full-screen pages.

---

## 9. States and interaction

- Pressed: `active:bg-slate-50` (cards, rows), `active:bg-slate-100` (icon buttons), `active:bg-[#1D4ED8]` (primary), `active:bg-blue-50` (outline / ghost), `active:bg-rose-50` (destructive).
- Focus: `focus-visible` outline or `ring-4 ring-blue-50` + `border-[#2F68FE]`; never remove focus styling.
- Selected: `#2F68FE` text/border with `blue-50` fill.
- Disabled: `opacity-60`, `cursor-not-allowed`; disabled link text `slate-400`.
- Interactive elements: `cursor-pointer`; surfaces `select-none`; text fields `select-text`; scroll areas `no-scrollbar`.
- Motion: short `transition-colors`; popovers `animate-in fade-in duration-150`; modal `zoom-in-95`; sheet slide 300ms; success pop animation (`.success-*`). No decorative animation; reduced-motion respected.
- Status always shown as a chip from 2.5 (same label → same color across Staff, Manager, Client).

---

## 10. Client → Staff/Manager replacement table

The Client screens currently use 160+ distinct hex colors (Staff/Manager ≈ 117 total, and those are consistent). Replace the following wherever they appear in `src/components/client/**`.

### 10.1 Borders, grays, fills
| Client uses | Replace with |
|---|---|
| `#DCE3ED` (≈69 card borders), `#EEF2F7`, `#E6ECF5` | `#EBF0F7` for cards / headers / bars; `slate-100` for inner dividers; `slate-200` for controls |
| `#0F172A`, `#101828` text | `#1E293B` |
| `#344054` | `slate-700` (`#334155`) |
| `#475467` | `slate-600` (`#475569`) |
| `#667085` | `slate-500` (`#64748B`) |
| `#98A2B3`, `#CBD5E1` text | `slate-400` (`#94A3B8`) |
| `#F2F4F7`, `#F3F4F8` | `slate-100` (`#F1F5F9`) |
| Near-white blue tints `#F5F8FF` (18×), `#F8FBFF`, `#FAFBFF`, `#FBFCFE`, `#F6F8FC`, `#F8FAFF`, `#F5F7FB`, `#F4F7FB`, `#FAFBFD`, `#FCFDFE` | `bg-slate-50` (neutral panel) or `bg-white` |
| Light blue tints `#EEF3FF`, `#EEF4FF`, `#EAF0FF`, `#E3EBFF`, `#E6EEFB`, `#F3F6FF`, `#D6E4FF`, `#E0EAFF` | `#EFF6FF` (`bg-blue-50`) with `border-blue-100`/`#BFDBFE`; or `#EEF2FF` for icon tiles |
| Blue variants `#5B8CFF`, `#7C9CFF`, `#2558E6`, `#60A5FA`, `#93C5FD`, `#C7D7FE`, `#C7DAFE` | `#2F68FE` (fill/text), `#BFDBFE` (border) |
| Dark navy fills (`slate-800/900`, `#1E293B` as button/hero fill) | `#2F68FE` primary button, or white card |
| `bg-[#F8FAFC] text-[#1E293B]` mismatches (`bg-white`, `#F5F7FB` as screen root) | Screen root = `bg-[#F8FAFC] text-[#1E293B]` |

### 10.2 Status and category colors
| Client uses | Replace with |
|---|---|
| Greens `#059669`, `#047857`, `#16A34A`, `#0E9F6E`, `#34D399`, `#A7F3D0`, `#D1FAE5`, `#F0FDF7`, `#F3FCF7`, teal `#0D9488`/`#E6F7F5` for status | Success chip `#E8F8F0` / `#10B981` |
| Ambers `#B45309`, `#92400E`, `#78350F`, `#FDE68A`, `#FFF7E6`, `#FFFDF5`, `#FFF5E5`, `#FDECC8` | Warning chip `#FEF8E7` / `#D97706` |
| Reds `#DC2626`, `#E11D48`, `#FFE4E6`, `#FFEEF1`, `#FFF5F5`, `#FFF8F8`, `#FF0000` | Danger chip `#FEF2F2` / `#EF4444` (text/outline `rose-600`) |
| Pink `#DB2777` / `#FDF2F8`, orange `#EA580C` / `#FFF7ED`, teal, purple `#A855F7`, `#6C5CE7`, `#7B83EB`, `#4338CA` used as category tints | One neutral tile: `bg-[#EEF2FF] text-[#2F68FE]` (or `bg-slate-100 text-slate-500`); distinguish categories by icon and label, not color |
| Indigo `#4F46E5` as the main accent | Reserve for the secondary-accent roles in 2.1; main accent is `#2F68FE` |

Third-party brand logos (e.g. Teams, Zoom, Meet marks, card networks) may keep their own colors **only as the small logo itself**; the surrounding tile, chip and text stay on the palette above.

### 10.3 Shape, depth and layout
| Client uses | Replace with |
|---|---|
| Gradient hero / header / banner (`from-[#1D4ED8] via-[#2F68FE] to-[#4F46E5]`, `rounded-b-[28px]` blue header blocks, blue "full-screen header + close" detail pages) | White `ScreenHeader` (back button, centered title) + white cards |
| Gradient icon tiles (`from-[#2F68FE] to-[#4F46E5]`, `CardHeading`, `SwitchTiles`) | Flat tile `w-8–11 rounded-xl bg-[#EEF2FF] text-[#2F68FE]` or `bg-blue-50 border border-blue-100` |
| Gradient buttons / progress / chips / avatars | Solid `#2F68FE` button; progress bar may use `#2F68FE → #6366F1` |
| Blue glow shadows `shadow-[0_6px_14px_-6px_rgba(47,104,254,0.7)]` etc., `shadow-[0_2px_10px_-2px_rgba(15,23,42,0.10)]`, `shadow-sm/md/lg` on cards | `shadow-2xs` (or the team-card shadow in 4) |
| `rounded-3xl` cards and heroes, 24px card radii | `rounded-2xl` (or `rounded-[20px]` for team/KPI cards). `rounded-3xl` only on modals |
| Half-pixel text (`10.5`, `11.5`, `12.5`, `13.5`) | `10`, `11`, `12`, `13`, `14` |
| White-on-color banners, filled colored section headers | White card + `text-sm font-bold` title + icon tile |
| Custom Client-only tab / switch / chip / filter / sheet designs | `SegmentedTabs`, underline tabs, filter chips, `FilterIconButton`, `BottomSheet` as specified in 6 |
| Different card layouts per Client module | The card patterns in 7 (record card, person card, KPI card, section card) |

---

## 11a. Client elements with no Staff/Manager equivalent

Staff/Manager has no in-phone toast, stepper, tooltip, progress ring or video player. Keep these elements and their behavior; style them only with the tokens above:

| Element | Style |
|---|---|
| Stepper (requirement form, survey, staff detail) | Track on `bg-slate-50 border border-slate-200 rounded-xl`; done / current step circle `bg-[#2F68FE] text-white`, upcoming `bg-white border border-slate-300 text-slate-400`; connector `border-t` — `#2F68FE` when done, `slate-300` when upcoming (dashed allowed); step label `text-[11px] font-semibold`, current `#1E293B`, others `slate-400` |
| Progress ring | Track `#DBEAFE`, value stroke `#2F68FE`, round cap; center value `text-[11px] font-extrabold #1E293B tabular-nums` |
| Progress bar | Track `bg-slate-100 rounded-full`, fill `#2F68FE` (or `#2F68FE → #6366F1`) |
| Tooltip / info hint | Same as the Staff balance-info panel: `p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-[#2F68FE]`, toggled by an `Info w-3.5 text-slate-400` button; or the popover surface in 6.7 for floating hints |
| Toast / snackbar | `bg-[#1E293B] text-white text-xs font-semibold rounded-xl px-4 py-3 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.28)]`, bottom-centered above the nav; success icon `#10B981` |
| Video modal | Backdrop `bg-slate-900/60 backdrop-blur-xs`; panel `bg-white rounded-3xl shadow-xl`; title `text-sm font-bold #1E293B`; close `w-8 h-8 rounded-full text-slate-400` |
| Dashed upload / drop zone | `border-2 border-dashed border-slate-300 rounded-2xl bg-white`; hover / active `border-[#2F68FE] bg-blue-50/50`; icon `#2F68FE`; same as `common/FileUploadField` |
| Skeleton | `rounded-lg bg-slate-200/70 animate-pulse` inside white cards |
| Calendar (range / date) | Reuse `RangeCalendar`: `p-4 bg-white border border-slate-200/90 rounded-2xl`, selected range `bg-blue-100/80`, selected day `#2F68FE` |

---

## 11. Compliance check (apply to every Client screen)

A Client screen is done only when all of these are true:

1. Screen root is `bg-[#F8FAFC] text-[#1E293B]`; header is the white `ScreenHeader`.
2. Every hex color in the file is in this document (sections 2.1–2.6). No other hex, no `bg-gradient-*` / `bg-linear-*` except the three allowed in 2.7.
3. Card borders are `#EBF0F7` / `slate-100`; control borders `slate-200`; no `#DCE3ED`.
4. Cards are white, `rounded-2xl` (or `rounded-[20px]` team/KPI), `shadow-2xs`; no colored shadow, no tinted card background.
5. Text colors are only `#1E293B`, slate-700/600/500/400, `#2F68FE`, white-on-fill and status text colors.
6. Fonts: Plus Jakarta Sans, sizes from the section 3 scale, weights bold / semibold / medium (extrabold only for greeting name, KPI numbers, modal title).
7. Status chips use exactly the section 2.5 pairs; same status → same color everywhere.
8. Buttons follow 6.1 (one `h-12` `#2F68FE` primary, outline secondary); no dark or gradient buttons.
9. Inputs, dropdowns, date fields, search, choice tiles, toggles match 6.2 pixel for pixel (focus ring included).
10. Filters use `FilterIconButton` + a bottom sheet with Clear All / Apply Filters; pickers and reviews are bottom sheets.
11. Tabs / segmented controls / chips match 6.3.
12. Empty, loading, error and success states match 6.10 / 6.6.
13. Avatars and icon tiles follow 6.9 and section 4 (no per-category color).
14. No breadcrumbs, no hero blocks, no blue detail headers.
15. Staff and Manager screens are untouched.
16. Zero text changes and zero functionality changes versus before the restyle (diff shows only classes / purely visual wrapper markup). Anything that would change either was asked about and approved with "OK" first.
