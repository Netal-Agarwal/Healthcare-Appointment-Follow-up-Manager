---
name: Clinical Precision & Care
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45474c'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#006398'
  on-secondary: '#ffffff'
  secondary-container: '#5bb8fe'
  on-secondary-container: '#00476e'
  tertiary: '#001815'
  on-tertiary: '#ffffff'
  tertiary-container: '#002f2a'
  on-tertiary-container: '#28a094'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#93ccff'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#004b73'
  tertiary-fixed: '#89f5e7'
  tertiary-fixed-dim: '#6bd8cb'
  on-tertiary-fixed: '#00201d'
  on-tertiary-fixed-variant: '#005049'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-gap: 80px
---

## Brand & Style

The design system is built on the principles of **Professional Modernism**. It balances the clinical authority required for healthcare with a human-centered warmth that reduces patient anxiety. The aesthetic is clean, structured, and highly legible, drawing from **Minimalism** and **Corporate Modern** styles to ensure the interface feels like a reliable medical tool rather than a generic tech product.

The target audience includes patients seeking clarity and healthcare providers requiring efficiency. The UI evokes an emotional response of security, precision, and calm. To achieve this, the system utilizes generous whitespace, a restricted but purposeful color palette, and a focus on information hierarchy that minimizes cognitive load during stressful medical interactions.

## Colors

This design system utilizes a tiered color strategy to establish trust and functional clarity:

- **Primary (Deep Navy):** Used for core branding, primary navigation, and high-level headings to anchor the UI in authority and security.
- **Secondary (Clinical Blue):** The functional action color. Used for primary buttons, active states, and interactive elements.
- **Tertiary (Mint Teal):** An approachable accent used for success states, health progress indicators, and "soft" interactive elements that need to feel welcoming.
- **Neutral (Slate Grays):** A comprehensive range of grays used for borders, secondary text, and surface backgrounds to maintain a high-contrast, "medical-grade" cleanliness.
- **AI Accent:** AI-powered features (summaries, smart scheduling) are denoted by a subtle violet-to-indigo gradient, distinguishing machine-assisted insights from standard clinical data without appearing playful or diagnostic.

## Typography

The typography system pairs **Plus Jakarta Sans** for headings with **Inter** for body and data. This combination ensures that marketing headlines feel soft and modern, while dense medical records and dashboard tables remain highly legible and systematic.

- Use **Plus Jakarta Sans** for all "Display" and "Headline" roles to inject personality and approachability.
- Use **Inter** for all "Body" and "Label" roles. Its neutral, utilitarian nature is perfect for the precision required in healthcare management.
- For data-heavy dashboards, prioritize `body-sm` and `label-sm` to maintain information density without sacrificing clarity.
- All letter-spacing on headings should be slightly tightened (negative) to create a more "editorial" and premium feel.

## Layout & Spacing

This design system adheres to a strict **8px grid** to ensure consistency across marketing pages and complex dashboards. 

- **Grid Model:** A 12-column fluid grid is used for desktop (breakpoint 1024px+). For dashboards, a fixed left-rail navigation (280px) is recommended with a fluid content area.
- **Vertical Rhythm:** Components should be separated using the `stack` units. Use `stack-lg` for separating distinct sections of information, and `stack-sm` for internal component spacing (e.g., label to input field).
- **Whitespace:** In patient-facing views, increase internal padding by 50% to create a "breathable" atmosphere. In doctor/admin dashboards, use the standard 8px units to maximize screen real estate.
- **Adaptivity:** On mobile devices, the 12-column grid collapses to a single column with 16px side margins. Large display typography scales down to the `mobile` variants defined in the typography section.

## Elevation & Depth

The design system uses a **Tonal Layering** approach combined with **Ambient Shadows** to establish hierarchy.

- **Surfaces:** The base background is light gray (#F8FAFC). Interactive "cards" and "containers" use a pure white (#FFFFFF) surface.
- **Shadows:** Shadows are highly diffused and low-opacity to avoid a "heavy" look. Use a soft navy-tinted shadow (e.g., `rgba(30, 41, 59, 0.08)`) for elevated elements like modals and primary cards.
- **Borders:** For non-elevated containers (like table cells or secondary sections), use a 1px border in a light slate tone (#E2E8F0) rather than a shadow. This keeps the medical interface feeling structured and grounded.
- **AI Elevation:** Features using AI assistance should have a unique, very thin (1px) gradient border or a subtle violet glow to signify they occupy a different "logical" layer than standard data.

## Shapes

The shape language is defined as **Rounded (Level 2)**. This specific radius (8px default) strikes the perfect balance between the friendliness of a consumer app and the professional stability of a medical institution.

- **Standard Elements:** Buttons, input fields, and small cards use the base 0.5rem (8px) radius.
- **Large Containers:** Dashboard widgets and sections use `rounded-lg` (1rem/16px) to clearly define content groupings.
- **Selection Indicators:** Checkboxes and radio buttons should maintain a small 4px radius (soft) to feel modern, avoiding the harshness of sharp 90-degree corners.

## Components

### Buttons
- **Primary:** Solid #0284C7 with white text. High-contrast, 8px radius.
- **Secondary:** White background with a #E2E8F0 border and #1E293B text.
- **Ghost:** No border or background, using #0284C7 text. Reserved for low-priority actions or "Cancel" buttons.

### Input Fields
- Labels must always be visible above the field using `label-md`. 
- Focused states use a 2px blue ring with a subtle 4px offset to ensure accessibility and clear focus.
- Placeholder text uses #94A3B8 (muted neutral).

### Cards
- Medical records and appointment cards should use a white background, 1px slate border, and `rounded-lg` corners.
- Hover states should trigger a subtle ambient shadow and a slight upward shift (2px) to denote interactivity.

### AI Indicators
- For AI-assisted summaries, use a small "sparkle" icon or a subtle `ai_accent_gradient` underline. Avoid full-card gradients to prevent the UI from looking "gamey."

### Status Chips
- **Scheduled:** Light blue background, dark blue text.
- **Completed:** Light teal background, dark teal text.
- **Urgent/Follow-up:** Light rose background, dark red text.
- All chips are pill-shaped (`rounded-xl`) to distinguish them from actionable buttons.