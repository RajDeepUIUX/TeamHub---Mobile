# CLIENT_APP_MEMORY.md
Single source of truth for building the **Client** app. Read at the start of every task; update after every module.
Last updated: 2026-10-14 (Phase 1 analysis)

## 0. Branch status (important)
| Branch | State |
|---|---|
| `br_hrms_appdesign` (current local checkout) = `main` | Initial prototype only: Attendance & Leaves screen. **No role switcher, no Manager, no Client.** |
| `origin/sept-changes` (latest, 47 commits, last: 2026-10-14) | Full app: Staff + Manager + role switcher + empty `ClientApp` stub. **Client work must be built on this branch.** |
Analysis below is of `origin/sept-changes`.

## 1. Tech stack
| Item | Value |
|---|---|
| Framework | React 19 + Vite 8, TypeScript (`.tsx`), SPA, no router |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), utility classes inline, hex colors as arbitrary values (`text-[#2F68FE]`) |
| Global CSS | `src/index.css` (font, `.no-scrollbar`, `.ticket-rich`, success animations, `.screen-title`) |
| Icons | `lucide-react` |
| Animation | `motion` (`motion/react`) — only in `ScreenTransition` |
| State | `useState` in `App.tsx` (2,288 lines) + `BottomSheetContext`. No Redux/Zustand. |
| Routing | None. Screen = conditional render chain in `App.tsx`; `screen {key, depth}` drives `ScreenTransition` |
| Data | Mock seeds in `src/data/*.ts`, types in `src/types/*.ts`. No API calls (`@google/genai`, `express` installed but unused) |
| Font | Plus Jakarta Sans 400–700 (+ Caveat 600 for signatures), Google Fonts in `index.html` |
| Scripts | `npm run dev` (port 3000), `npm run lint` = `tsc --noEmit` |

## 2. Folder structure (sept-changes)
```
src/
  App.tsx                 # studio bar + role switcher + all Staff/Manager state & screen routing
  main.tsx, index.css
  components/
    auth/ home/ attendance/ leaves/ holidays/ wfo/ feed/ notifications/
    more/ profile/ resignation/ support/ tickets/ assets/
    common/               # shared sheets/pickers (BottomSheet, DatePicker, TimeWheel, MultiSelect, TeamFilterSheet…)
    client/ClientApp.tsx  # ← Client entry (blank stub)
  design-system/
    tokens.ts, components/ (BottomSheet, Dropdown, MobileDeviceFrame, MobilePrimitives,
    RangeCalendar, ScreenTransition, SegmentedTabs, StatusBadge, TopAppBar, BottomNav)
  context/BottomSheetContext.tsx
  data/   (≈25 seed files)   types/ (user, attendance, leaves, wfo, tickets, …)
public/brand/  Icon.png, Logo.png, logo-horizontal.png, logo-hrms247.png
```
Naming: `PascalCase` components, `XxxView.tsx` = full screen, `XxxSheet.tsx` = bottom sheet, `xxxData.ts` = seeds with `*_SEED` / `INITIAL_*` consts, named exports (`export const X: React.FC<Props>`).

## 3. Role switcher
- Type: `src/types/user.ts` → `UserRole = 'Staff' | 'Manager' | 'Client'`, `USER_ROLES`.
- UI: studio top bar in `App.tsx` (desktop chrome, outside the phone frame). `setUserRole(role)` + toast.
- Staff/Manager: same app, branch on `isManager` (separate state per role for leaves, tickets, OT, flex, resignations, notifications). Drawer items filtered by `roles: ['Manager']`.
- **Client:** `App.tsx` renders `{userRole === 'Client' ? <ClientApp /> : …}` inside `BottomSheetProvider` → `MobileDeviceFrame`, **before** the auth check. ClientApp gets no props → fully self-contained (own state, nav, data). No `App.tsx` change needed to add Client screens.

## 4. Design system
| Token | Value |
|---|---|
| Primary / accent | `#2F68FE` (dominant, ~600 uses); `tokens.ts` says `#2563EB` but code uses `#2F68FE` |
| Text primary | `#1E293B`; secondary `slate-500/600`; muted `slate-400` |
| Canvas / surface | `#F8FAFC` / `#FFFFFF` |
| Borders | `#EBF0F7` (headers, nav), `slate-100/200` (cards) |
| Accent tints | `#EFF6FF` bg + `#BFDBFE` border; indigo `#4F46E5`/`#EEF2FF`; violet = Manager badge |
| Semantic | success `#10B981`/`#E8F8F0`, warning `#D97706`/`#FEF8E7`, danger rose/`#FEF2F2`, info `#1D4ED8` |
| Font sizes | `text-xs` & `text-[11px]` most common; `text-[10px]` labels; `text-sm` body; `text-base` titles; `text-[15px]` sheet titles |
| Radius | `rounded-xl` (controls), `rounded-2xl` (cards), `rounded-full` (pills/avatars), sheet top 24px |
| Shadow | `shadow-2xs` (cards), `shadow-xs`, bottom bars `shadow-[0_-4px_20px_rgba(0,0,0,0.05)]` |
| Spacing | screen `px-4`, card `p-4`/`p-3.5`, list `space-y-3`, touch ≥ 44px, CTA 48px (`h-12`) |
| Theme | **Light only** — no dark mode |
| Devices | `MobileDeviceFrame`: Pixel 8 (default), iPhone 16 Pro, iPhone SE |

## 5. Layout patterns
| Pattern | How it's done |
|---|---|
| App header | `home/AppHeader` — menu ☰, horizontal logo, bell w/ rose badge, avatar; `h-14 bg-white/95 border-b` |
| Screen header | back `ArrowLeft` (w-9 h-9 rounded-full) + centered `.screen-title` (`text-base font-bold`) |
| Bottom nav | `home/AppBottomNav` — 4 tabs (Home, Attendance, Learning, Leaves), `h-16`, active `#2F68FE` + 15% fill |
| Side drawer | `home/SideDrawer` — user card, search, collapsible groups from `MORE_GROUPS` (icon + tint + hint) |
| Sub-tabs | underline tabs (Attendance & Leaves); `SegmentedTabs` pills for My / Team's |
| Cards | `bg-white rounded-2xl border border-slate-100 shadow-2xs p-4`; collapsible cards w/ Expand/Collapse all |
| KPI tiles | 3-up grid, big number + label (`AttendanceKPIs`, `HomeDashboard` StatRow/SectionCard) |
| Bottom sheets | `common/BottomSheet` (drag handle, title + X, scroll body, sticky footer); registered in BottomSheetContext |
| Forms | full-screen `XxxFormView` with sticky bottom CTA; pickers via sheets (DateWheel, TimeWheel, Dropdown, MultiSelect) |
| Filters | `FilterIconButton` (44px, count badge) → filter sheet; `TeamFilterSheet` helpers `matchesFilters` |
| Status | `StatusBadge` / inline pills (Pending amber, Approved green, Rejected rose) |
| Empty state | `MobilePrimitives.EmptyState` / white card with message + "Clear Filter" link |
| Success | `LeaveSubmittedModal`-style popup with `.success-*` animations; toast in studio bar |
| Loading / error | Not implemented (mock data only) |
| Transitions | `ScreenTransition` slide by depth |

## 6. Shared components (reuse read-only; never edit)
| Component | Purpose | Used by |
|---|---|---|
| design-system/MobileDeviceFrame | phone frame + sheet portal | App (all roles) |
| design-system/ScreenTransition | push/pop slide | Staff, Manager |
| design-system/SegmentedTabs | My/Team pill tabs | Manager mostly |
| design-system/Dropdown | portal select, search sheet >6 options | Staff, Manager |
| design-system/RangeCalendar | date range calendar | Attendance, Leaves |
| design-system/StatusBadge, MobilePrimitives (StickyBottomAction, SegmentedControl, ListRowItem, EmptyState), TopAppBar, BottomNav, BottomSheet | primitives | various |
| common/BottomSheet | standard sheet | almost every module |
| common/DatePickerSheet, DateWheelSheet, TimeWheelSheet, TimeField | date/time pickers | forms |
| common/MultiSelectSheet, MultiSelectDropdown | multi-select | forms, filters |
| common/TeamFilterSheet (+FilterIconButton) | team filters | Manager team views |
| common/CommentThreadSheet | chat-style comments | requests (flex, resignation, tickets, advance) |
| context/BottomSheetContext | open-sheet registry | all |
| home/AppHeader, AppBottomNav, SideDrawer | app shell | Staff, Manager |
| auth/AuthFlow, AuthPrimitives, BrandLogo | splash/login/forgot pw, logos | Staff, Manager |
| profile/ProfileAvatar, home/celebrationUtils (`initialsOf`, `avatarTint`) | avatars | many |

## 7. Functionality
- Flow: Splash → Login (or Forgot password) → Home dashboard → bottom tabs / drawer modules / profile modules.
- Data flow: all state in `App.tsx`, passed as props + callbacks (`onSubmit`, `onBack`, `onToast`). Manager decisions update shared records → Staff sees result; `pushNotification('Staff'|'Manager', …)` feeds role inboxes.
- Forms: inline validation, disabled CTA until valid, success modal/toast.
- Filters/search: filter sheets + text search in lists/drawer.
- Notifications: per-role list, unread badge, deep-link to module.
- No real API, no persistence (reset button restores seeds).

## 8. Staff / Manager module list
| Module | Staff | Manager | One line |
|---|---|---|---|
| Auth | ✓ | ✓ | Splash, login, forgot/reset password |
| Home dashboard | ✓ | ✓ | Day start, celebrations, attendance, learning, requests, action queue |
| Celebrations | ✓ | ✓ | Birthdays/anniversaries + wish sheet |
| Notifications | ✓ | ✓ | Inbox, mark all read, deep links |
| Attendance | ✓ | ✓ team | KPIs, daily cards, punch logs, edit request; Mgr: team attendance + review/bulk review |
| Leaves | ✓ | ✓ team | Balance, apply/edit/cancel, details; Mgr: team leaves + review |
| Holidays | ✓ | ✓ | Public holiday calendar |
| WFO Days | ✓ | ✓ team | WFO requests; Mgr: team WFO review |
| Company Feed | ✓ | ✓ | Announcements, reactions, post detail |
| My Team | – | ✓ | Team hierarchy, member profile edit |
| Work Timing / Flexibility | ✓ | ✓ team | Shift + WFH/Hybrid requests, agreement, staff declaration, IT review timer |
| OT Availability | ✓ | ✓ team | Extra hours availability |
| Appraisal, Work Profile | – | ✓ | Drawer items (Manager only) |
| My Learning | ✓ | ✓ | Coming soon |
| Training Request | ✓ | ✓ team | Request training, My/Team tabs |
| Recognitions | ✓ | ✓ | Awards & appreciation |
| My Profile / Staff Review / Annual Review | ✓ | ✓ | Profile tabs, intro video, evaluations |
| Change Password, Account Settings | ✓ | ✓ | Profile menu |
| Resignation | ✓ | ✓ team | Apply/withdraw; Mgr review |
| Tickets | ✓ | ✓ team | Create (rich text), track, actions |
| Feedback | ✓ | ✓ | Drawer item |
| Adv. Salary & EV Loan | ✓ | ✓ team | Request + guidelines; Mgr review |
| Relevant Contacts, VOIP Directory | ✓ | ✓ | Directories |
| Asset | ✓ | ✓ team | Assigned devices |
| Cab Request | ✓ | ✓ | Office transport |

## 9. Client app rules & location
- Entry: `src/components/client/ClientApp.tsx` (client-owned; safe to edit).
- All Client files: `src/components/client/`
  - `ClientApp.tsx` (client state + screen routing), `<module>/XxxView.tsx|XxxSheet.tsx`, `common/` (client copies/wrappers of shared comps), `data/` (client seeds), `types/` (client types).
- Import shared design-system/common components read-only. Need a change → copy into `client/common/`.
- Never edit: `App.tsx`, `index.css`, `tokens.ts`, `types/user.ts`, shared components, config, package.json.
- No new packages without approval. Light theme only, `#2F68FE` accent, Plus Jakarta Sans.

## 10. Client module tracker
| # | Module | Status | Screens / components | Notes |
|---|---|---|---|---|
| – | (none yet) | – | – | Waiting for first module instruction |
