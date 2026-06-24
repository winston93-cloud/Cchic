---
name: Atmospheric Glass
colors:
  surface: "#0b1326"
  surface-dim: "#0b1326"
  surface-bright: "#31394d"
  surface-container-lowest: "#060e20"
  surface-container-low: "#131b2e"
  surface-container: "#171f33"
  surface-container-high: "#222a3d"
  surface-container-highest: "#2d3449"
  on-surface: "#dae2fd"
  on-surface-variant: "#c4c7c8"
  inverse-surface: "#dae2fd"
  inverse-on-surface: "#283044"
  outline: "#8e9192"
  outline-variant: "#444748"
  surface-tint: "#c6c6c7"
  primary: "#ffffff"
  on-primary: "#2f3131"
  primary-container: "#e2e2e2"
  on-primary-container: "#636565"
  inverse-primary: "#5d5f5f"
  secondary: "#adc9eb"
  on-secondary: "#14324e"
  secondary-container: "#304b68"
  on-secondary-container: "#9fbbdd"
  tertiary: "#ffffff"
  on-tertiary: "#620040"
  tertiary-container: "#ffd8e7"
  on-tertiary-container: "#ab3779"
  error: "#ffb4ab"
  on-error: "#690005"
  error-container: "#93000a"
  on-error-container: "#ffdad6"
  primary-fixed: "#e2e2e2"
  primary-fixed-dim: "#c6c6c7"
  on-primary-fixed: "#1a1c1c"
  on-primary-fixed-variant: "#454747"
  secondary-fixed: "#d0e4ff"
  secondary-fixed-dim: "#adc9eb"
  on-secondary-fixed: "#001d35"
  on-secondary-fixed-variant: "#2d4965"
  tertiary-fixed: "#ffd8e7"
  tertiary-fixed-dim: "#ffafd3"
  on-tertiary-fixed: "#3d0026"
  on-tertiary-fixed-variant: "#85145a"
  background: "#0b1326"
  on-background: "#dae2fd"
  surface-variant: "#2d3449"
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 84px
    fontWeight: "700"
    lineHeight: 90px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: "600"
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: "500"
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "600"
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 24px
  card-gap: 16px
  section-margin: 40px
  glass-padding: 20px
components:
  glass-card-standard:
    backgroundColor: rgba(255, 255, 255, 0.1)
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: "{spacing.glass-padding}"
  glass-card-elevated:
    backgroundColor: rgba(255, 255, 255, 0.2)
    textColor: "{colors.primary}"
    rounded: "{rounded.xl}"
    padding: "{spacing.glass-padding}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.xl}"
    height: 48px
    padding: 0 24px
  button-primary-hover:
    backgroundColor: "{colors.primary-fixed-dim}"
  button-ghost:
    backgroundColor: rgba(255, 255, 255, 0.05)
    textColor: "{colors.primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.xl}"
  input-field:
    backgroundColor: rgba(255, 255, 255, 0.1)
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: 20px
    height: 48px
  weather-display-large:
    textColor: "{colors.primary}"
    typography: "{typography.display-lg}"
  metric-label:
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-sm}"
  list-item-interactive:
    backgroundColor: transparent
    rounded: "{rounded.md}"
    padding: 12px
  list-item-interactive-hover:
    backgroundColor: rgba(255, 255, 255, 0.1)
---

## Brand & Style

Atmospheric Glass — glassmorphism con gradientes vibrantes, tipografía Inter y capas de profundidad por blur y transparencia.
