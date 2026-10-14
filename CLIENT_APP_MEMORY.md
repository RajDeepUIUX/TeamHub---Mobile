# CLIENT_APP_MEMORY.md
Single source of truth for the **Client** mobile app (MYCPE ONE HRMS 24*7 → Client tab).
Read at the start of every task; update after every module.
Last updated: 2026-10-14 (Phase 1 + Phase 2 done; waiting for first module)

## 0. Project setup & status
| Item | Value |
|---|---|
| Mobile project (style source + build target) | `C:\TeamHub---Mobile` (React app). Note: there is **no** `C:\wamp64\www\TeamHub---Mobile` |
| Desktop source (functionality source) | `C:\wamp64\www\erp_entigrity_client_panel` (PHP/Smarty, branch `main`) |
| Local branch in VS Code | `br_hrms_appdesign` (= `main` + commit `dc07808 md file add` with this file). Only has the old Attendance & Leaves prototype. **No role switcher, no `src/components/client/`.** |
| Full app branch | `origin/sept-changes` (47 commits, last 2026-10-14, author RajDeepUIUX): Staff + Manager + role switcher + empty `ClientApp` stub. Part A below was analyzed from this branch. |
| Running app seen in screenshots | `http://192.168.10.137:3000` — runs `sept-changes` code from **another folder / PC**, not this folder. Edits here will not show there. |
| Run locally | `npm ci --legacy-peer-deps` (plain `npm install` fails: ERESOLVE — `esbuild ^0.25` in package.json vs Vite 8 peer `esbuild ^0.27/0.28`; harmless) → `npm run dev` → `http://localhost:3000` |
| Pending action (user) | `git switch sept-changes` before any Client code is built (tree is clean; switch is safe). This file is committed on `br_hrms_appdesign` → bring it over (`git checkout br_hrms_appdesign -- CLIENT_APP_MEMORY.md`) or re-commit on the new branch. |

## 1. Rules from the user (always follow)
### Scope (code)
1. All work **inside the Client tab only**. Staff and Manager must look and work exactly as before.
2. New files only in the Client folder; follow Staff/Manager naming and structure.
3. Never edit shared components, global styles, theme/tokens, routes, `App.tsx`, config. Need a change → Client copy/wrapper. Truly unavoidable shared change → STOP, show exact diff, explain, wait for approval.
4. Reuse the TeamHub design system exactly; no new visual style.
5. Never delete, rename or move existing files. No new packages without asking. No extra files (README/docs/tests) — except this memory file and the module design files the user asked for.
### Module workflow (code)
1. Read this file → 2. Short plan (screens, components, files; files outside Client = none) → wait for **"go"** → 3. Build (design + working functionality: navigation, states, mock data, validation, responsive) → 4. Self-check: `git diff --name-only` only Client files changed, Staff/Manager still work, no console errors / broken imports (`npm run lint`) → 5. Report: ✅ built · 📁 files (full paths) · ⚠️ risks/assumptions · 🔜 next module → 6. Update this file.
- "undo" = revert only the last module's Client files.
### Design workflow (per module, from the 2nd brief)
1. Match the user's module instruction against the **desktop module's real functionality** (Part B).
2. Unclear / conflicting / missing → ask first, short grouped questions.
3. Design in TeamHub mobile style (Part A).
4. Keep every inter-module connection working (links, shared data, status updates, navigation); no desktop function lost; no earlier module broken.
5. Useful extras (states, flows, edge cases, shortcuts) → add and mark **"Added by designer"**.
- **Design file per module must contain:** purpose + roles · screen list + navigation flow (entry points, back behavior) · each screen: layout, TeamHub components, fields, actions, states (empty, loading, error, success, **no permission**) · business rules + validations · inter-module connections · desktop → mobile mapping (every desktop feature, or why it changed) · "Added by designer" items · open questions/risks.
- Never drop desktop functionality silently; never change the design system or approved modules unless asked; optimize for thumb reach, fewer taps, readable cards instead of wide tables.
### Reply style
Answer first, short, bullets/tables, plain English, show only changed code parts, flag security / data-loss / breaking risks, one-line assumption instead of asking unless truly blocked.

---
# PART A — Mobile design system & app (TeamHub, `sept-changes`)

## A1. Tech stack
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

## A2. Folder structure (sept-changes)
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

## A3. Role switcher
- Type: `src/types/user.ts` → `UserRole = 'Staff' | 'Manager' | 'Client'`, `USER_ROLES`.
- UI: studio top bar in `App.tsx` (desktop chrome, outside the phone frame). `setUserRole(role)` + toast.
- Staff/Manager: same app, branch on `isManager` (separate state per role for leaves, tickets, OT, flex, resignations, notifications). Drawer items filtered by `roles: ['Manager']`.
- **Client:** `App.tsx` renders `{userRole === 'Client' ? <ClientApp /> : …}` inside `BottomSheetProvider` → `MobileDeviceFrame`, **before** the auth check. ClientApp gets no props → fully self-contained (own state, nav, data). No `App.tsx` change needed to add Client screens.

## A4. Design system
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

## A5. Layout patterns
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

## A6. Shared components (reuse read-only; never edit)
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

## A7. Functionality
- Flow: Splash → Login (or Forgot password) → Home dashboard → bottom tabs / drawer modules / profile modules.
- Data flow: all state in `App.tsx`, passed as props + callbacks (`onSubmit`, `onBack`, `onToast`). Manager decisions update shared records → Staff sees result; `pushNotification('Staff'|'Manager', …)` feeds role inboxes.
- Forms: inline validation, disabled CTA until valid, success modal/toast.
- Filters/search: filter sheets + text search in lists/drawer.
- Notifications: per-role list, unread badge, deep-link to module.
- No real API, no persistence (reset button restores seeds).

## A8. Staff / Manager module list
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

## A9. Client code location
- Entry: `src/components/client/ClientApp.tsx` (client-owned; safe to edit).
- All Client files: `src/components/client/`
  - `ClientApp.tsx` (client state + screen routing), `<module>/XxxView.tsx|XxxSheet.tsx`, `common/` (client copies/wrappers of shared comps), `data/` (client seeds), `types/` (client types).
- Import shared design-system/common components read-only. Need a change → copy into `client/common/`.
- Never edit: `App.tsx`, `index.css`, `tokens.ts`, `types/user.ts`, shared components, config, package.json.
- No new packages without approval. Light theme only, `#2F68FE` accent, Plus Jakarta Sans.

---
# PART B — Desktop source: erp_entigrity_client_panel (analyzed 2026-10-14)
Path: `C:\wamp64\www\erp_entigrity_client_panel` (branch `main`). PHP MVC + Smarty (`controller/` 67, `model/` 52, `templates/`), Bootstrap 5, jQuery, DataTables, select2, offcanvas side panels, toastr, daterangepicker. Font Inter, primary `#3A58EF`, text `#1D2939/#344054`, border `#EAECF0`.
Best references: `docs/CLIENT_HELP_GUIDE.pdf` (44 modules, step-by-step), `chatbot_context.md`, `graphify-out/GRAPH_REPORT.md`.

## B1. Access & permissions
- Login: email + password, forgot/reset password, credential request; SSO to MyCPE services (`mycpeServiceSSO`).
- Roles: Admin vs contact member; custom **Client Contact Roles** (`clientcontactroles`) with per-menu permissions `is_list / is_view / is_add / is_edit / is_delete / is_download`. Menu tree + permissions are stored in **DB** (not in code) → every mobile screen needs a "no permission" state.
- Demo account hides some actions (`erp_client_id == demo_account_id`).

## B2. Module map (menu groups inferred from help-guide paths)
| Group | Module (controller) | Key actions |
|---|---|---|
| Home | Dashboard (`dashboard`, `new_dashboard`) | Offshore staff summary, feed like/dislike, polls, load more, Important Updates mark read/dismiss all, birthdays/anniversaries, holidays, welcome tour |
| Human Resources | My Staff (`projects`) | List, search, status filter (Active / Inactive / On Notice / Offboarding / Replacement), staff profile tabs: Personal, Work info, Attendance-Leave, Timesheets, Documents, Training, Assessments, Appraisals, SOP, Compensation, System details (assets), Resignation, Mapped contacts; Reports & Invoices |
| | Attendance Management (`attendancemanagement`) | Daily attendance list, **approve correction requests** (`acceptAttendance`), filters |
| | Leave Management (`clientleavemanagement`, `leavemanagement`) | Leave records, balance, deduction details, filters |
| | Holidays (`holidays`) | Calendar by month |
| | Task Repository (`taskrepository`) | Create / view / delete task, assign to staff, filter |
| | Staff Can Perform (`staffcanperform`) | Skills per staff, unassign task capability |
| | Staff Documents (`staffdocuments`) | List, filter, download |
| | Meetings (`clientmeeting`) | List, agenda + documents, comments, schedule meeting |
| | Policies & Guidelines (`policy_guideline`, `policies`) | View; Admin add/edit/delete + file upload |
| | Staff Work Flexibility (`staff_work_flexibility`) | NEW: WFO / Hybrid / WFH preference form (front-end only, spec in `docs/superpowers/specs`) |
| | Directories (`directories`) | POC/contact directory with chat channels |
| Hire New Staff | Available Staff Hub (`staffingMarketplace`) | Search/filter profiles, like/wishlist, linked profiles, request interview, **Zoom slot booking/cancel** + ICS/calendar emails, hire → creates requirement |
| | Staff Requirements (`demands`) | Create (AI-generated JD or upload JD), edit, view, comments, status, filter; cascading domain → profile → level → hours → price |
| | Interviews / Shortlisted (`interviews`) | Candidate list, status counts, view resume, submit interview feedback, assessments |
| | Hiring Pricing (`hiringpricing`) | Pricing reference |
| | Temp / Seasonal Staffing (`temp_staffing`) | TS requests, overtime history, hire new staff, cancel request |
| L&D | Learnings (`learnings`) | Staff progress, training requests + feedback, assign assessments, view results |
| | Mandatory Learning (`mandatorylearning`) | Course completion per staff |
| Feedback & Evaluation | Performance Mgmt (`performace_management`) | Goals CRUD, categories, comments, track goals, feedback form |
| | PIP (`pipcontroller`) | PIP goals, view detail, chat + documents |
| | Staff Assessment (`staff_assetment`), 30/60-day survey, Service Assessment (`service_assetment`) | Multi-step survey, progress bar, reset, PDF |
| | HBR Reports (`hbrreports`) | View, download PDF, filter |
| Reports & Finance | Invoices & Timesheets (`projects` report tabs) | Invoice list/detail, PDF/CSV (single + combined), timesheets, export all, PDF zip |
| | Payroll Ledger (`payrolls`) | List, filter, export |
| | Compensation (`compensation`), Mgmt Fee Structure | View + filter |
| | Staff Utilization Report | Ranges (week/month/quarter/custom), buckets ≤50 / 51-70 / 71-90 / ≥90 %, histogram, staff detail, activity log |
| | Leave Utilization Report | Holiday details, export, filter |
| | Timesheet Notes (`timesheetnotes`) | Activity notes, comments, action items + comments |
| | Employee Monitoring | Activity logs, time tracking, add / terminate monitoring |
| Resources & Community | Client Resources (`clientresources`, onboarding, best practices, expansion, industry info…), Resources, FAQs, Monthly Updates (`client_updates`), Circles (`entigrityCircles`), Client Surveys, Client Referrals (add/edit), Inclusions | Mostly read / download; referrals CRUD; surveys multi-tab |
| Account | User Profile, Company Profile, Client Contacts (add/edit/delete/make admin, send credentials), Contact Roles, Settings (email prefs, update email), Change Password, Staff Agreements (e-sign, customize offer letter) | |
| Global | AI Chatbot (`chatbot`, read-only, IP-restricted), Live chat, Account Manager card (email, phone, WhatsApp, Teams, Slack, Skype) | |

## B3. Inter-module connections
- **Hiring chain:** Available Staff Hub → (interview request + Zoom) → Staff Requirement (`demands`) → Interviews/Shortlisted → feedback → hired staff appear in **My Staff**. Temp Staffing "hire new staff" feeds the same hub.
- **My Staff = hub:** staff profile tabs read Attendance, Leave, Timesheets, Documents, Training (L&D), Assessments, Appraisals, SOP, Compensation, Assets, Resignation.
- **Attendance ↔ Leave ↔ Holidays:** correction approval changes attendance; leave deductions + holidays feed Leave Utilization Report.
- **Finance chain:** Timesheets → Invoices → Payroll Ledger; Staff Agreement salary package → payroll ledger; Mgmt Fee + Hiring Pricing feed requirement pricing.
- **Activity data:** Employee Monitoring, Timesheet Notes, Staff Utilization Report share activity logs.
- **Performance:** Goals (Perf Mgmt) ↔ PIP goals; assessments/surveys → HBR reports.
- **Comms:** Client Updates → Dashboard Important Updates; Settings email prefs control notifications.
- **Permissions:** Contact Roles control menu visibility + allowed actions in every module.

## B4. Extra desktop details (deep dive)
| Area | Detail |
|---|---|
| Login | Email + password, Forgot password → email link → Reset password, Credential request page, logout; Welcome tour (Next/Skip/Finish, `tour_completed`) |
| Global shell | Sidebar: Dashboard, permission-based menu groups, **Other Modules & Services** (MyCPE modules via SSO; "Active"/"Currently Active" tags; MSP / MSSP pricing links), **News & Insights** (6 external my-cpe.com links), profile dropdown (User Profile, Contact list, Settings, Change Password, Logout), **Account Manager card** (email, phone, WhatsApp, iMessage/Text, Teams, Slack, Skype, LinkedIn, technical staff phone), chatbot (IP-restricted), live chat widget |
| Dashboard | Sections: My Offshore Staff, "What's Happening Around!" feed (tabs + show more, like/dislike, load more), polls (vote), Important Updates (mark read / dismiss all), onboarding items, welcome info popup, birthdays/anniversaries, holidays |
| My Staff list | Fields: Staff Name, Designation, Level, Engagement Type, Joining Date, Location, Committed hours, Additional Availability, Rate/hr, Status. Status: **Active, Inactive, On Notice, Offboarding In-Progress, Replacement In-Progress**. Actions: access staff details, check timesheet info |
| Staff profile tabs (templates/projects) | Personal information, Work information, About/Education/Experience/Skills/Software/Background Verified, Attendance-Leave, Timesheets, Documents (employee + terms), Training & development (in-house trainings, hours), Assessments, Appraisals, SOP (list, status change, file delete), Compensation, System details (assets), Mapped contacts (add), Resignation, Staff-wise report, Invoices/report |
| Attendance | Tabs: **Attendance View** + **Attendance Amend** (requests). Columns: Staff, Date, Check in/out, Total office time, Total time, Work mode (Office / WFH / Hybrid), Status (Full day / Half day / Absent / Holiday / Half PL / Last Day Half Day). Request types: Card Missing, Punching Error, Punching Machine Error, Left Early and Set Off Hours on Other Day, Overtime, Other. Actions: **Approve / Reject** (bulk: multiple attendance ids) + comment + comment type + set-off-hours date; "Apply for Attendance". Filters: staff, department, designation, level, status, work mode, date |
| Leave | Columns: Staff, Leave Type, Start/End Date, Applied On, Reason, Deducted From; **Leave deduction details** popup; filters + Clear All (view only, no approve on client side) |
| Staff Requirement (demand) form | Step 1 **Core Details**: Hiring Type, Domain → Profile → Level (cascading), Hours/Week, Duration, Expected Start Date, Onboarding Timeline, Work Mode Preference, Time Zone (EST…), Preferred Available Upto Time, Budget Hourly Rate, Tentative Price (auto). Step 2 **Additional Details**: Type of Task, Software requirements, Reporting To, Expected Communication Involvement, Overtime Requirement, Sign Audit Report?, Sign Tax Return?, Travel to US?, Interview Required?, Technical Assessment Required?, Job Description (AI generate or upload file), Anything specific. Step 3 **Choose Next Action**: Proceed to Schedule (date + Available Slots → Zoom) or Shortlist (Schedule later) → View Shortlisted Candidates. Demand status: **Pending, Completed, Not Required**; comments thread |
| Available Staff Hub | Filters: Domain (Accounting & Bookkeeping, Audit & Assurance, Tax incl. Expatriate / Non-Resident / Inpatriate, Business Valuation, Advisory…), Level, Hourly Rate, Software (CCH Axcess, Drake, Freshbooks…), OT Round the Year / OT Seasonal, Joining In. Profile: About, Experience, Qualifications, Certification, Practical Training Courses, Psychometric Evaluation (download), Communication Skills, Appreciations, Feedback, Background Verified. Actions: Like, Request Interview / Cancel Interview, Shortlisted, Linked profiles, Interview Requested list |
| Interviews | Statuses: **Shortlisted → Interview Scheduled → Interview Done → Selected → Hired** (+ Pending/Rejected); status counts; view resume; interview feedback; SC assessments |
| Staff Utilization | Ranges: current week, last week, last month, last quarter, custom; buckets ≤50%, 51–70%, 71–90%, ≥90%; histogram; staff detail + activity log |
| REST API (`rest/api.php`) | Only `login`, `logout`, `check_mycpe_menu_access` exist → a real mobile app would need new APIs (prototype uses mock data) |
| Legacy files | `*_old`, `* - Copy`, dated backups (e.g. `sidebar_08_01_2025.tpl`) → ignore |

---
# PART C — Desktop → mobile conventions (apply to every module)
| Desktop | Mobile |
|---|---|
| DataTable list | Card list (key 3–4 fields + status pill), tap → detail screen; "Load more" / infinite scroll instead of paging |
| Filter bar + Clear All | `FilterIconButton` (count badge) → filter bottom sheet with Apply / Clear |
| Search box | Search field at top of list |
| Offcanvas side panel (view) | Full-screen detail (slide in) |
| Offcanvas form (add/edit) | Full-screen form, fixed bottom CTA; multi-step forms → stepper with progress |
| Confirm popup (delete/approve) | Bottom sheet confirm |
| Tabs | Underline tabs (≤4) or segmented pills; many tabs (staff profile) → scrollable chips or section list |
| Export CSV / PDF / zip | Share / download sheet (format choice) |
| Bulk approve | Select mode (long-press / "Select") + sticky action bar |
| Toastr | Toast / success popup (TeamHub pattern) |
| Permission flags | Hide actions without `is_add/is_edit/is_delete/is_download`; module without `is_list` → "No access" state |
| Desktop colors (`#3A58EF`, Inter) | **Not used** — mobile uses TeamHub tokens (`#2F68FE`, Plus Jakarta Sans) |
Every screen designs: empty · loading (skeleton) · error (retry) · success · no permission.

---
# PART D — Decisions & open questions
| # | Item | Status |
|---|---|---|
| 1 | Output format per module: **A** HTML design file (clickable mobile screens + full spec) in local `client-design/` · **B** build in React Client tab · **C** A then B (recommended) | **Open — waiting for user** |
| 2 | Exact desktop sidebar tree/labels (stored in DB) — user screenshot would confirm | Open |
| 3 | Help guide sections for PIP, Circles, Client Surveys are empty; Temp Staffing, Directories, Work Flexibility, Inclusions not in guide → rely on code | Noted |
| 4 | Desktop-heavy features (Employee Monitoring time tracking, offer-letter customization, survey PDFs, bulk PDF zip exports) → propose mobile-light versions | Per module |
| 5 | Chatbot on mobile? (desktop is IP-restricted) | Open |
| 6 | Client branch switch to `sept-changes` | Waiting for user |
| 7 | Assumption: "Client" = CPA firm that hires MYCPE ONE offshore staff; client app is fully separate from Staff/Manager (no shared screens/data, per `ClientApp.tsx` comment) | Assumed |

---
# PART E — Client module tracker
| # | Module | Desktop source | Status | Design file | Screens / components | Notes |
|---|---|---|---|---|---|---|
| – | (none yet) | – | – | – | – | Waiting for first module instruction |
