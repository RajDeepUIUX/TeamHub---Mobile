# Claude Code Implementation Prompt — MYCPE ONE Mobile: Upload & Autofill with AI

## 0. Execution contract

Act as a senior mobile application engineer working within the existing MYCPE ONE mobile repository. Implement the feature described below end to end, rather than returning only a plan or static mockup.

### 0.1 Inspect before implementing

1. Locate the Profile → Create Certificates → Upload & Autofill with AI entry point and trace the existing navigation, mobile framework, design tokens, shared components, state management, file picker, document viewer and service integrations.
2. Inspect the existing external-credit submission workflow, AI extraction contract, qualification/provider/field-of-study masters and validation rules wherever available in the repository.
3. Inspect supplied desktop screenshots if available in the Claude Code workspace. Use them for functional reference, not desktop layout replication. If they are unavailable, use this specification and report that limitation.
4. Identify the smallest set of files that must change. Reuse existing patterns; do not introduce a new framework, dependency or unrelated refactor without necessity.
5. Create a concise implementation plan, then execute it. Do not stop after producing the plan.

### 0.2 Requirement priority and scope boundaries

- The explicit conditional business rules in this specification are mandatory. Existing application contracts and screenshots supply integration and functional details not specified here. Report material conflicts rather than silently inventing behavior.
- Preserve existing Profile, navigation and all other Create Certificates options. This task covers the AI upload flow, including manual correction/fallback within that flow; it does not authorize redesigning the separate manual-entry flow.
- Use actual services where available. If unavailable, isolate clearly identified mock services and demo data; never imply a mock operation is real extraction or submission.
- Do not fabricate missing API contracts, eligibility rules, validation policies or progress percentages. Document any integration gaps in the completion report.

### 0.3 Recommended implementation sequence

1. Repository discovery and route integration.
2. Domain state, option lists, conditional rules and validation helpers.
3. Upload screen and AI processing states.
4. Review screen, certificate cards, session cards and qualification credit mapping.
5. Submission, confirmation, error handling and navigation.
6. Mobile layout, accessibility and state-preservation checks.
7. Run relevant tests, lint/type checks and build commands available in the repository; report results and unresolved blockers.



---

## Part 1 — Product scope and journey


### Requirement 1 — Objective

Implement the existing web-based external credit certificate upload and AI autofill functionality within the MYCPE ONE mobile application.

The objective is to enable learners to upload external continuing education certificates, automatically extract certificate information using AI, review and edit the extracted details, map multiple qualifications, allocate credits against relevant fields of study, and submit certificates through a seamless mobile-first experience.

I have attached multiple screenshots of the existing web platform. Use these screenshots as the authoritative reference for functional behavior, conditional fields, qualification mapping, and course session management.

Do not directly replicate the desktop layout. Redesign the interface specifically for mobile devices while retaining the same business logic.


### Requirement 2 — Implementation Location

The existing mobile application already has the following navigation:

**Profile → Create Certificates → Upload & Autofill with AI**

Implement this functionality when the user selects **Upload & Autofill with AI**.

Important instructions:

- Retain the existing Profile screen.
- Retain the existing Create Certificates options.
- Do not redesign unrelated application screens.
- Follow the existing mobile application's design system, typography, primary colors, icons, navigation patterns, and component styling.
- Implement this as a dedicated mobile screen flow rather than displaying the desktop interface inside a WebView.


### Requirement 3 — End-to-End User Journey

The complete user journey should be:

1. Navigate to Profile.
2. Select Create Certificates.
3. Select Upload & Autofill with AI.
4. Upload one or more certificates, up to five.
5. Select relevant qualifications.
6. Initiate AI analysis.
7. Display an interactive AI processing experience.
8. Display individual certificate sections containing extracted information.
9. Allow users to review and edit each certificate.
10. Allow users to manage qualification and credit allocations.
11. Dynamically display course sessions where applicable.
12. Validate all certificate details.
13. Submit certificates.
14. Display a successful submission confirmation.
15. Allow the user to navigate to their Credit Certificates listing.

The entire journey must feel like a native mobile application.


---

## Part 2 — Domain model and conditional business rules


### Requirement 7 — Certificate Details – Standard Structure

Each expanded certificate section should contain the following fields.

#### 7.1 Course Title

- Label: Course Title
- Field type: Text input
- Mandatory: Yes
- Single value
- Automatically populated by AI wherever available
- Editable by the user
- Placeholder: Enter course title

Use a full-width input field.

Allow long course titles to wrap appropriately without causing horizontal scrolling.

#### 7.2 Date of Completion

- Label: Date of Completion
- Field type: Mobile date picker
- Mandatory: Yes
- Automatically populated by AI wherever available
- Editable by the user

Display the selected date in a readable format.

Example: Nov 18, 2026.

This field is conditionally removed from the main certificate section when the certificate contains multiple course sessions.

#### 7.3 Method of Delivery

- Label: Method of Delivery
- Field type: Single-select searchable bottom sheet
- Mandatory: Yes

The available options must be exactly:

- Group Program
- Self Study Program
- Blended Learning Programs
- Committee / Firm Meeting
- Publication
- Instruction
- University
- Technical Reviewer
- Informal Learning
- Certification Programs
- Editorial Advisory Credit
- Fraud Magazine
- ACFE Working Group
- CFE Exam Development
- ACFE-Approved Certification Programs
- Chapter Programming
- Project Work
- Mentoring

Do not add additional options or modify the provided labels.

Since this list contains multiple options, provide search functionality within the selection bottom sheet.

#### 7.4 Learning Method

- Label: Learning Method
- Field type: Single-select bottom sheet
- Mandatory: Yes, whenever applicable

The visibility and available options must depend entirely on the selected Method of Delivery.

**Condition A: Group Program**

Display the Learning Method field with:

- Live Webinars
- In-Person Events
- Virtual Conference

**Condition B: Self Study Program**

Display the Learning Method field with:

- On Demand
- E-Books
- Podcasts
- Nano Courses

**Condition C: Any other Method of Delivery**

Completely hide the Learning Method field.

Do not display it as a disabled field.

Do not leave empty space where the field was previously displayed.

If the user changes the Method of Delivery, reset incompatible Learning Method values.

#### 7.5 Continuing Education Provider

- Label: Continuing Education Provider
- Field type: Single-select searchable bottom sheet
- Mandatory: Yes

Available options:

- AICPA
- ACFE
- Becker Professional Education
- Checkpoint Learning (Thomson Reuters)
- CPA Academy
- Kaplan

Display the selected provider in the field.

Ensure long provider names remain readable within the mobile layout.

#### 7.6 License Selection

- Label: License Selection
- Field type: Searchable multi-select bottom sheet
- Mandatory: Yes
- Allow multiple selections

Available qualifications:

- AFSP
- Alabama - CPA (US)
- Alaska - CPA (US)
- CA - Ireland
- CFE
- CMA
- CPE
- CPP
- California - IAR
- Idaho - CPA (US)
- Iowa - CPA (US)

Allow the user to independently select qualifications for each certificate.

Do not automatically apply the same final qualification mapping to every certificate without allowing individual review.

This field is conditionally removed from the main certificate section when multiple course sessions are enabled.

#### 7.7 Uploaded Certificate

Display the original certificate attached by the user.

Include:

- File name
- File type
- File size
- View Certificate action

The View Certificate action should open a full-screen mobile document viewer.

Support zooming and scrolling within the certificate preview.

When the user returns from the preview, preserve the certificate form, selected values, and scroll position.


### Requirement 8 — Standard Qualification & Credits Mapping

This structure applies to all certificates that do not contain multiple course sessions.

#### 8.1 Dynamic Qualification Cards

Whenever the user selects qualifications from License Selection, dynamically generate one independent card for each selected qualification.

For example, if the user selects:

- CMA
- CA - Ireland
- Alaska - CPA (US)

Generate three qualification cards within the certificate section.

Each card must include:

- Qualification name as the header
- Total allocated credits
- Remove qualification action
- Field of Study
- Credits

Qualification cards must be vertically stacked on mobile devices.

Do not display three cards side by side as shown in the desktop reference screenshots.

#### 8.2 Field of Study

- Field type: Single-select searchable bottom sheet
- Mandatory: Yes

Available options:

- Accounting
- Accounting & Auditing
- Auditing
- Behavioral Ethics
- Business Law
- Communications and Marketing
- Ethics
- Federal Ethics
- Federal Tax Law
- Federal Tax Update
- Finance
- Information Technology

Use the exact provided list.

If qualification-specific Field of Study mappings already exist in the application, use those mappings to determine applicable options.

#### 8.3 Credits

- Field type: Numeric input
- Mandatory: Yes
- Support decimal values
- Display a decimal numeric keyboard
- Do not allow negative or invalid numeric values

Display the allocated credits in the qualification card header.

Example:

**CMA · 2.0 Credits**

#### 8.4 Single Field of Study Restriction

For certificates that do not contain multiple course sessions, each qualification card must allow only one Field of Study and its corresponding credits.

Do not display an Add Field of Study action in this scenario.

For example:

**CMA**

- Field of Study: Accounting
- Credits: 2.0

CA - Ireland

- Field of Study: Auditing
- Credits: 2.0

Alaska - CPA (US)

- Field of Study: Accounting
- Credits: 2.0

These qualification allocations are independent.

Do not sum credits across different qualifications and present them as the actual credits earned by attending the course.


### Requirement 9 — Conditional Multiple Sessions Functionality

#### 9.1 Visibility Rules

Display an additional question titled:

**Does this certificate include multiple sessions?**

Use a compact Yes/No segmented control.

Display this question only when:

- Method of Delivery = Group Program
- AND Learning Method = In-Person Events OR Virtual Conference

Do not display this question for:

- Live Webinars
- Self Study Program
- Any other Method of Delivery

Where AI can determine whether a certificate contains multiple sessions, prepopulate the selection.

The user must be able to change the selection.

#### 9.2 When Multiple Sessions = No

Follow the standard certificate structure.

Display:

- Course Title
- Date of Completion
- Method of Delivery
- Learning Method
- Multiple Sessions question
- Continuing Education Provider
- License Selection
- Qualification & Credits cards
- Uploaded Certificate

Each qualification must have only one Field of Study and its corresponding credits.

#### 9.3 When Multiple Sessions = Yes

Dynamically change the certificate structure.

Remove the following fields from the main certificate section:

- Date of Completion
- License Selection
- Main-level Qualification & Credits cards

Retain:

- Course Title
- Method of Delivery
- Learning Method
- Multiple Sessions question
- Continuing Education Provider
- Uploaded Certificate

Create a new section titled:

**Course Sessions**

Move Date of Completion and qualification selection into each individual course session.

Do not duplicate these fields at the main certificate level.


### Requirement 10 — Course Sessions – Multiple Sessions Structure

#### 10.1 Course Sessions Header

Display:

**Course Sessions**

Supporting text:

"Add each session included in this certificate and allocate its credits."

Display the number of sessions.

Example:

**Course Sessions (3)**

Provide an **Add Session** action.

By default, create at least one session when Multiple Sessions is selected as Yes.

If AI identifies multiple sessions, automatically create the corresponding session cards and populate the extracted details.

#### 10.2 Session Cards

Create expandable session cards within the respective certificate.

Each session must be independent.

A collapsed session should display:

- Session number
- Session name
- Date of Completion
- Number of mapped qualifications
- Completion status
- Expand/collapse action

Example:

**Session 1 – Financial Reporting**

Nov 18, 2026 · 3 Qualifications

Allow users to expand and collapse individual sessions.

Avoid excessive nesting and ensure the session hierarchy remains visually clear.

#### 10.3 Fields Within Each Session

Each session must contain:

**Session Name**

- Text input
- Mandatory
- AI populated wherever available
- Editable

**Date of Completion**

- Mobile date picker
- Mandatory
- Independent date for each session

**Qualifications**

- Searchable multi-select bottom sheet
- Mandatory
- Use the same qualification list specified earlier
- Independent qualification selection for each session

Selecting qualifications within one session must not change the qualifications selected in other sessions.

#### 10.4 Dynamic Qualification Cards Within Sessions

For each selected qualification, create an individual qualification card within that session.

For example:

If Session 1 has three selected qualifications:

- CMA
- CA - Ireland
- CFE

Create three qualification cards within Session 1.

Each qualification card should contain:

- Qualification name
- Number of Fields of Study
- Total allocated credits for that qualification
- Remove qualification action
- Field of Study rows
- Add Field of Study action

#### 10.5 Multiple Fields of Study

This functionality is exclusive to qualifications mapped within multiple course sessions.

Allow users to add multiple Fields of Study within each qualification card.

Each row must contain:

- Field of Study – Single select
- Credits – Numeric input
- Remove row action

Display an action:

**+ Add Field of Study**

When selected, dynamically append a new Field of Study and Credits row within the same qualification card.

Do not create a separate qualification card for every Field of Study.

Example:

**CA - Ireland**

4 Fields of Study · 8.0 Credits

- Communications and Marketing – 2.0 Credits
- Business Law – 2.0 Credits
- Auditing – 2.0 Credits
- Accounting – 2.0 Credits
- Add Field of Study

**California - IAR**

2 Fields of Study · 3.0 Credits

- Ethics – 1.0 Credit
- Finance – 2.0 Credits
- Add Field of Study

The number of Fields of Study can differ for every qualification.

Do not force qualification cards to have equal heights.

Prevent duplicate Field of Study selections within the same qualification card.

Automatically recalculate the qualification-level total whenever credits are added, edited, or removed.

#### 10.6 Adding and Removing Sessions

Provide an Add Session action after the existing session cards.

When the user adds a session:

- Create an independent session card.
- Automatically expand the newly added session.
- Preserve all previously entered session information.
- Move focus to the Session Name field where appropriate.

Allow users to remove individual sessions.

Display confirmation before removing a session containing entered information.

Maintain at least one session whenever Multiple Sessions is enabled.

Do not impose an arbitrary maximum number of sessions unless an existing application-level restriction is available.


### Requirement 11 — Conditional Business Logic

Implement the following exact rules:

| Method of Delivery            | Learning Method    | Multiple Sessions Question | Credit Mapping    |
| ----------------------------- | ------------------ | -------------------------- | ----------------- |
| Group Program                 | Live Webinars      | Hidden                     | Certificate level |
| Group Program                 | In-Person Events   | Visible                    | Based on Yes/No   |
| Group Program                 | Virtual Conference | Visible                    | Based on Yes/No   |
| Self Study Program            | On Demand          | Hidden                     | Certificate level |
| Self Study Program            | E-Books            | Hidden                     | Certificate level |
| Self Study Program            | Podcasts           | Hidden                     | Certificate level |
| Self Study Program            | Nano Courses       | Hidden                     | Certificate level |
| All other Methods of Delivery | Hidden             | Hidden                     | Certificate level |

When Multiple Sessions = No or is not applicable:

- Date of Completion is captured at certificate level.
- License Selection is captured at certificate level.
- Multiple qualifications are allowed.
- Only one Field of Study is allowed per qualification.

When Multiple Sessions = Yes:

- Date of Completion is captured at session level.
- Qualifications are captured at session level.
- Multiple sessions are allowed.
- Multiple qualifications are allowed within each session.
- Multiple Fields of Study are allowed within each qualification.

These restrictions must be enforced through the application logic and not only through visual components.


### Requirement 12 — Handling Changes in Conditional Fields

If the user modifies Method of Delivery, Learning Method, or Multiple Sessions after AI processing or manual entry, dynamically update the applicable form structure.

Examples:

**Scenario 1**

User changes Group Program to Self Study Program.

- Replace the available Learning Method options.
- Clear the previously selected incompatible Learning Method.
- Remove the Multiple Sessions question.
- Switch to the standard certificate structure.

**Scenario 2**

User changes Virtual Conference to Live Webinars.

- Remove the Multiple Sessions question.
- Restore Date of Completion and License Selection at certificate level.
- Follow the single Field of Study restriction.

**Scenario 3**

User changes Multiple Sessions from No to Yes.

- Remove certificate-level Date of Completion and License Selection.
- Create the Course Sessions section.
- Allow session-level qualification mapping.
- Allow multiple Fields of Study per qualification.

**Scenario 4**

User changes Multiple Sessions from Yes to No after entering multiple sessions.

Display confirmation explaining that the certificate structure will change and existing session-specific information may be removed.

Do not silently delete user-entered information.

If the user cancels the confirmation, retain the original selection and all entered information.

Do not automatically combine credits from different sessions or qualifications in a manner that could result in incorrect credit reporting.


### Requirement 18 — State Management and Data Independence

Maintain independent state for:

- Each uploaded certificate
- Each certificate's Course Title
- Each certificate's Method of Delivery
- Each certificate's Learning Method
- Each certificate's Multiple Sessions selection
- Each certificate's qualifications
- Each course session
- Each session's qualifications
- Each qualification's Fields of Study
- Each Field of Study's allocated credits
- Each certificate's review status
- Each uploaded certificate file

Editing one certificate must never modify another certificate.

Editing one session must never modify another session.

Adding or removing a qualification must update only its respective certificate or session.

Preserve information when users:

- Expand or collapse cards
- Switch between certificates
- Open and close bottom sheets
- Preview a certificate
- Navigate between sessions
- Encounter validation errors

Display an unsaved changes confirmation if the user attempts to leave the flow after entering or modifying certificate details.


---

## Part 3 — Screen implementation


### Requirement 4 — Screen 1 – Upload Certificates

#### 4.1 Screen Header

Title: **Upload & Autofill with AI**

Include a back navigation icon following the existing application's navigation pattern.

Display a compact information section:

"Upload your certificates and let AI automatically identify, classify, and organize your course details. Review the information and confirm your qualifications before submitting."

Avoid large promotional banners or unnecessary illustrations.

#### 4.2 Qualification Selection

Display a field titled:

**Select Qualifications**

Allow the user to select one or multiple qualifications relevant to the certificates being uploaded.

Use a searchable multi-select bottom sheet instead of a traditional desktop dropdown.

Selected qualifications should appear as compact, removable chips.

If multiple qualifications are selected, display a summary such as "3 qualifications selected" to prevent excessive vertical expansion.

The qualifications selected at this stage should be used as context for AI processing. Users must still be able to independently modify qualification mapping for each certificate during review.

#### 4.3 Upload Certificates

Create a mobile-friendly upload section.

Display:

- Upload Certificates
- Upload up to 5 certificates
- Supported formats: PDF, JPG, PNG
- Maximum file size: 20 MB per certificate

Provide a clearly visible **Add Certificates** action.

When tapped, open a native-style bottom sheet with the following options:

- Browse Files
- Choose from Photos
- Take a Photo

Use the existing application's supported file selection and camera capabilities.

Allow users to upload multiple files together or add them individually.

#### 4.4 Uploaded Certificate Listing

Once certificates are uploaded, display a compact list.

Each uploaded file should contain:

- File type icon or thumbnail
- File name
- File size
- Upload status
- Remove action
- Preview action

Display the uploaded certificate count, for example:

**3 of 5 certificates added**

Provide an Add More Certificates action until the maximum limit of five is reached.

Once five certificates have been added, disable the additional upload action and display:

"You can upload a maximum of 5 certificates at a time."

Do not allow additional certificates beyond this limit.

#### 4.5 Primary Action

Display a sticky bottom action:

**Analyze with AI**

Include a subtle AI sparkle icon.

Enable the action only when at least one valid certificate has been uploaded and the required qualification selection has been completed.

The button must remain accessible without covering any screen content or interfering with the mobile safe area.


### Requirement 5 — Screen 2 – AI Certificate Analysis

Create a dedicated AI processing screen after the user selects Analyze with AI.

The experience should communicate that the application is actively analyzing the uploaded certificates.

#### 5.1 AI Animation

Use a lightweight, professional animation containing elements such as:

- Animated certificate or document icon
- Moving scanning line
- Subtle AI sparkle effects
- Smooth progress transitions
- Animated extraction of document information

Avoid excessive animation, full-screen gradients, flashing effects, or distracting visual elements.

Respect the device's reduced-motion accessibility preferences.

#### 5.2 Processing Content

Display the primary message:

**Analyzing your certificates**

Supporting text:

"AI is extracting your course details and identifying relevant credit information."

Display processing stages where supported by actual processing status:

1. Reading certificates
2. Extracting course information
3. Identifying learning methods
4. Mapping qualifications and credits
5. Preparing certificates for review

Do not display fabricated processing completion percentages when actual progress is unavailable. Use an indeterminate progress indicator instead.

#### 5.3 Individual Certificate Status

If the user uploads three certificates, display three individual processing rows.

Example:

- Certificate 1 – Analysis complete
- Certificate 2 – Analyzing
- Certificate 3 – Waiting to be analyzed

Use appropriate icons for pending, processing, completed, and failed states.

If one certificate fails analysis, retain the successful results for the remaining certificates and provide Retry or Enter Details Manually for the failed certificate.

Do not discard successfully analyzed certificates.

#### 5.4 Completion

Once analysis is complete, transition to the certificate review screen.

Display:

**Your certificates are ready for review**

Supporting text:

"Review the extracted information, confirm your qualifications, and make any necessary changes before submitting."

AI-generated information must remain editable. AI extraction does not represent verification or approval of external certificates.


### Requirement 6 — Screen 3 – Review Certificates

#### 6.1 Screen Header

Title: **Review Certificates**

Supporting text:

"Review and confirm the details of your uploaded certificates."

Display the number of certificates requiring review.

Example:

**3 certificates · 0 of 3 reviewed**

Update the reviewed count as the user completes each certificate.

#### 6.2 Certificate Navigation

If the user uploads multiple certificates, create one independent section for every certificate.

Do not display all certificate forms expanded simultaneously.

Use mobile-friendly expandable certificate cards with accordion behavior.

Each collapsed certificate card should display:

- Certificate number
- Extracted course title
- Method of Delivery
- Learning Method, wherever applicable
- Number of mapped qualifications
- Review status
- Expand/collapse icon

Use the following review statuses:

- Needs Review
- Incomplete
- Reviewed
- Analysis Failed, wherever applicable

Expand the first certificate by default.

When the user opens another certificate, preserve the information entered in the previous certificate.

Use clear visual separation between certificate cards.

For example, if three certificates were uploaded:

**Certificate 1 of 3**

Virtual Accounting Conference

Group Program · Virtual Conference

3 Sessions · Needs Review

**Certificate 2 of 3**

Advanced Financial Reporting

Self Study Program · On Demand

3 Qualifications · Reviewed

**Certificate 3 of 3**

Professional Ethics Publication

Publication

2 Qualifications · Needs Review

These are example titles for prototype demonstration purposes.

#### 6.3 Certificate Card Actions

Each certificate must support:

- Expand or collapse
- Edit certificate information
- Preview original uploaded certificate
- Remove certificate

Display a confirmation before removing a certificate containing extracted or manually entered information.

The removal of one certificate must not affect the remaining certificates.


### Requirement 14 — Certificate Review Completion

Each certificate should support independent review completion.

Provide an action within the expanded certificate section:

**Confirm & Continue**

When selected:

1. Validate the current certificate.
2. Highlight incomplete mandatory fields.
3. Mark the certificate as Reviewed when valid.
4. Collapse the reviewed certificate.
5. Expand the next certificate requiring review.
6. Preserve all entered information.

Allow reviewed certificates to be reopened and edited before final submission.

If a reviewed certificate is subsequently edited, update its review status until it is reconfirmed.

Display a compact overall review progress indicator.

Examples:

- 1 of 3 certificates reviewed
- 2 of 3 certificates reviewed
- All certificates reviewed


### Requirement 15 — Validation and Error Handling

#### 15.1 Upload Validation

Validate:

- Maximum five certificates
- Supported file formats
- Maximum 20 MB per certificate
- Successful file upload

Display errors near the respective file.

Example messages:

"This file exceeds the 20 MB limit."

"Unsupported file format. Please upload a PDF, JPG, or PNG file."

"You can upload a maximum of 5 certificates at a time."

#### 15.2 AI Extraction Validation

Handle situations where:

- AI cannot identify course details.
- AI cannot identify the provider.
- AI cannot identify the qualification.
- AI cannot identify credits.
- The uploaded document cannot be identified as a certificate.
- The certificate holder's name does not match the learner's name.

Do not populate fabricated information for fields AI cannot identify.

Display unidentified fields as empty and allow manual correction.

Follow existing web platform validation rules for documents that are not certificates or contain a certificate holder name mismatch.

#### 15.3 Certificate Form Validation

Validate all mandatory and applicable fields.

These include:

- Course Title
- Date of Completion, wherever applicable
- Method of Delivery
- Learning Method, wherever applicable
- Continuing Education Provider
- Multiple Sessions selection, wherever applicable
- At least one qualification
- Field of Study
- Valid credit values
- Uploaded certificate
- All mandatory session details

If a certificate or session is collapsed and contains an error, display an Incomplete status on its header.

Automatically expand and scroll to the first invalid field when appropriate.

Hidden conditional fields must not participate in validation.


### Requirement 16 — Final Submission

Display a sticky bottom footer on the Review Certificates screen.

The footer should contain:

- Review progress
- Submit Certificates primary action

Dynamically update the CTA based on the number of certificates.

Examples:

- Submit Certificate
- Submit 2 Certificates
- Submit 3 Certificates
- Submit 5 Certificates

Enable submission only after all certificates satisfy the applicable validation and review requirements.

Prevent accidental duplicate submissions.

Display a loading state while submission is in progress.

Preserve entered information if submission fails and allow the user to retry.

Integrate with the existing external credit certificate submission workflow.

Do not introduce a new approval, verification, or compliance-credit posting process that differs from the existing web platform.


### Requirement 17 — Success Confirmation Screen

After successful submission, display a clean confirmation screen.

Title:

**Certificates submitted successfully**

Supporting text:

"Your certificate details have been submitted and will be processed according to the existing credit certificate workflow."

Display a summary of the submitted certificates.

Example:

- Certificates submitted: 3
- Submission status: Successful

Provide two actions:

Primary: **View Credit Certificates**

Secondary: **Add More Certificates**

Do not communicate that externally submitted credits are verified or approved unless the existing application workflow confirms that status.


---

## Part 4 — Mobile design and accessibility


### Requirement 13 — Mobile UI/UX Design Guidelines

#### 13.1 Overall Design Direction

Create a clean, compact, professional enterprise mobile interface.

Follow the existing MYCPE ONE mobile application design language.

The design should feel:

- Native to mobile
- Professional
- Easy to scan
- Accessible
- Compact without being congested
- Consistent across all certificate types

Avoid:

- Desktop-style multi-column forms
- Excessive purple backgrounds
- Large decorative banners
- Unnecessary illustrations
- Oversized cards
- Excessive white space
- Horizontal scrolling
- Multiple nested scrollable containers

#### 13.2 Background and Card Contrast

The application background should remain white.

To establish a clear visual hierarchy:

- Use a subtle neutral background for the expanded certificate section.
- Use white input fields with visible neutral borders.
- Use distinct borders around qualification cards.
- Use subtle tinted backgrounds for session headers.
- Use the existing primary brand color for active selections and primary actions.

Do not place completely white cards on a white background without sufficient visual separation.

Do not apply heavy shadows to every nested component.

Suggested fallback colors, only if existing design tokens are unavailable:

- Screen background: #FFFFFF
- Certificate section background: #F6F7F9
- Qualification card background: #FFFFFF
- Border: #DDE2E9
- Primary text: #172033
- Secondary text: #667085
- Active accent: Existing MYCPE ONE primary purple

#### 13.3 Mobile Spacing

Use a consistent spacing system based on 4-point and 8-point increments.

Recommended:

- Screen horizontal padding: 16 dp
- Card internal padding: 12–16 dp
- Spacing between related fields: 12 dp
- Spacing between major sections: 16–24 dp
- Card corner radius: 10–12 dp

Avoid unnecessary spacing between a field label and its corresponding input.

#### 13.4 Typography

Follow the existing mobile application's typography system.

Suggested hierarchy:

- Screen title: 20–22 sp, semibold
- Certificate title: 16 sp, semibold
- Section title: 15–16 sp, semibold
- Field labels: 13–14 sp, medium
- Input values: 16 sp
- Supporting information: 12–14 sp

Support accessibility text scaling.

Do not truncate qualification names or course information in a way that prevents users from understanding their selections.

#### 13.5 Touch Targets

Ensure all interactive controls have accessible touch areas.

- Target approximately 44 pt on iOS.
- Target at least 48 dp on Android.

Apply this to:

- Remove icons
- Expand/collapse icons
- Calendar icons
- Selection controls
- Add Session actions
- Add Field of Study actions
- File preview actions

Visual icons can remain compact while maintaining a sufficiently large touch area.

#### 13.6 Input Layout

Use a single-column layout for primary certificate fields.

Within each qualification card, Field of Study and Credits may appear side by side if sufficient space is available.

Suggested proportion:

- Field of Study: 70–75%
- Credits: 25–30%

On smaller mobile screens or when larger accessibility text is enabled, stack these fields vertically.

Never truncate a selected Field of Study merely to maintain a two-column layout.

#### 13.7 Dropdown and Multi-Select Experience

Do not use desktop-style dropdown menus.

For long option lists, implement searchable bottom sheets.

Each bottom sheet should include:

- Clear title
- Search input
- Scrollable option list
- Radio selection for single-select fields
- Checkbox selection for multi-select fields
- Visible selection state
- Done action for multi-select fields
- Safe-area-aware layout

For multi-select fields, display the selected count and preserve selections when searching.

#### 13.8 Keyboard and Scrolling

Ensure the following:

- The keyboard does not cover the focused input.
- Automatically scroll focused fields into view.
- Use appropriate keyboard types.
- Allow the keyboard to be dismissed naturally.
- Maintain form state during keyboard interactions.
- Use one primary vertical scrolling container per screen.

#### 13.9 Accessibility

Ensure:

- Sufficient text and component contrast
- Accessible labels for icon-only actions
- Screen-reader-friendly form labels
- Clearly identifiable required fields
- Visible focus states
- Inline validation messages
- Accessible error and success indicators
- Reduced-motion support
- Support for dynamic font sizes

Do not rely exclusively on colors to communicate statuses or errors.


---

## Part 5 — Interactive demonstration and delivery


### Requirement 19 — Prototype Demonstration Scenarios

Create a fully interactive demonstration using three uploaded certificates within the same review flow.

#### Certificate 1 – Group Program / Virtual Conference

Course Title: Annual Accounting and Finance Conference

Method of Delivery: Group Program

Learning Method: Virtual Conference

Multiple Sessions: Yes

Continuing Education Provider: AICPA

Create three course sessions.

**Session 1 – Advanced Financial Reporting**

Date of Completion: Nov 18, 2026

Qualifications:

CA - Ireland

- Accounting: 2.0 Credits
- Auditing: 1.0 Credit

**CMA**

- Accounting: 3.0 Credits

Alaska - CPA (US)

- Accounting: 2.0 Credits
- Finance: 1.0 Credit

**Session 2 – Professional Ethics**

Date of Completion: Nov 18, 2026

Qualifications:

California - IAR

- Ethics: 2.0 Credits

**CFE**

- Behavioral Ethics: 2.0 Credits

**Session 3 – Business and Technology**

Date of Completion: Nov 19, 2026

Qualifications:

CA - Ireland

- Business Law: 1.0 Credit
- Information Technology: 2.0 Credits

**CMA**

- Information Technology: 3.0 Credits

Ensure all sessions can be expanded, collapsed, edited, added, and removed.

#### Certificate 2 – Self Study Program / On Demand

Course Title: Advanced Financial Management

Date of Completion: Nov 20, 2026

Method of Delivery: Self Study Program

Learning Method: On Demand

Continuing Education Provider: Becker Professional Education

Qualifications:

**CMA**

- Finance: 2.0 Credits

**CFE**

- Finance: 2.0 Credits

Alaska - CPA (US)

- Finance: 2.0 Credits

Do not display Multiple Sessions.

Do not display Add Field of Study within the qualification cards.

#### Certificate 3 – Publication

Course Title: Emerging Trends in Professional Ethics

Date of Completion: Nov 21, 2026

Method of Delivery: Publication

Continuing Education Provider: ACFE

Qualifications:

**CFE**

- Ethics: 1.0 Credit

**CMA**

- Behavioral Ethics: 1.0 Credit

Do not display Learning Method.

Do not display Multiple Sessions.

Do not display Add Field of Study.

All example data is intended for demonstrating the interface and conditional functionality, not validating actual qualification eligibility.


### Requirement 20 — Final Implementation Instructions

Implement the complete interactive functionality, not merely static mobile screenshots.

Ensure the following actions work:

- Upload multiple certificates
- Remove uploaded certificates
- Preview certificates
- Select multiple initial qualifications
- Display AI processing states
- Review and edit extracted information
- Change Method of Delivery
- Dynamically change Learning Method
- Show and hide Multiple Sessions
- Switch between certificate-level and session-level credit mapping
- Select multiple qualifications
- Dynamically generate qualification cards
- Add and remove course sessions
- Add and remove multiple Fields of Study where applicable
- Automatically calculate qualification-level credit totals
- Validate certificate forms
- Confirm individual certificate reviews
- Submit multiple certificates
- Display submission confirmation

If the AI extraction service or certificate submission API is not connected in the current prototype, implement clearly identified mock responses through a separate service layer so that actual services can be integrated later.

Do not represent mock AI extraction as real certificate analysis.

Use the attached desktop screenshots as functional references, but prioritize the mobile experience in all layout decisions.

Do not modify unrelated modules, existing navigation, the Profile section, or other Create Certificates options.

The final output must deliver a complete, polished, responsive, mobile-first implementation that follows the existing MYCPE ONE mobile application design system and retains the complete conditional business logic described above.


---

## Part 6 — Implementation acceptance checklist

Use this checklist to verify the implementation, in addition to the detailed requirements above.

| ID | Scenario | Expected result |
| --- | --- | --- |
| AC-01 | Open existing navigation entry | Dedicated native mobile flow; unrelated screens unchanged |
| AC-02 | Upload 1–5 supported files | PDF/JPG/PNG accepted within 20 MB each; sixth file blocked; preview and remove work |
| AC-03 | Select initial qualifications | Searchable multi-select; selection retained; per-certificate mapping remains editable |
| AC-04 | Analyze a mixed batch | Individual processing states; no fabricated progress; successful analyses retained on individual failure |
| AC-05 | Group Program / Live Webinars | Learning Method visible; multiple sessions hidden; standard mapping |
| AC-06 | Group Program / In-Person Events or Virtual Conference / No | Multiple sessions question visible; certificate-level date and qualification mapping; one field per qualification |
| AC-07 | Group Program / In-Person Events or Virtual Conference / Yes | Session-level date and qualifications; no duplicate main-level mapping; multiple fields per qualification |
| AC-08 | Self Study Program | Only specified learning methods; no multiple sessions; standard mapping |
| AC-09 | Publication or other delivery method | Learning Method and multiple sessions hidden; standard mapping |
| AC-10 | Change conditional fields | Incompatible values cleared; destructive changes confirmed; cancel retains prior data; no incorrect credit merging |
| AC-11 | Add/remove session | Independent state; at least one session maintained in session mode; populated removal confirmed |
| AC-12 | Add/remove field of study within session | Duplicate field selections prevented; qualification totals recalculate; variable card heights |
| AC-13 | Review multiple certificates | Accordion state preserved; confirm validates; edits invalidate prior review; next incomplete certificate opens |
| AC-14 | Invalid or missing AI data | Empty editable unidentified fields; existing non-certificate/name-mismatch rules applied |
| AC-15 | Submit certificates | Enabled only when all reviewed and valid; loading and duplicate protection; failed submission retains data |
| AC-16 | Successful submission | Confirmation and navigation actions; no unsupported claim of credit approval |
| AC-17 | Mobile/accessibility checks | White background with visible card hierarchy; safe areas, keyboard, touch targets, text scaling and reduced motion supported |
| AC-18 | Mixed three-certificate demo | Conference with sessions, On Demand and Publication work together with independent editable state |

## Part 7 — Completion report

After implementing, provide:

- Summary of functionality delivered and files changed.
- Existing components and services reused, plus any new components or helpers.
- Real versus mocked integrations and any missing screenshots, APIs or business-rule dependencies.
- Test/build/lint results, including commands run and any failures or tests not run.
- Any deviations from this specification, assumptions or unresolved issues requiring product review.

Do not claim completion of an integration or test that was not actually performed.
