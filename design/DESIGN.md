---
name: MakerSpace Lübbecke Design System
colors:
  surface: '#0d131f'
  surface-dim: '#0d131f'
  surface-bright: '#333946'
  surface-container-lowest: '#080e1a'
  surface-container-low: '#161c27'
  surface-container: '#1a202c'
  surface-container-high: '#242a36'
  surface-container-highest: '#2f3542'
  on-surface: '#dde2f3'
  on-surface-variant: '#bcc9ca'
  inverse-surface: '#dde2f3'
  inverse-on-surface: '#2a303d'
  outline: '#879394'
  outline-variant: '#3d494a'
  surface-tint: '#68d6e3'
  primary: '#6ddbe7'
  on-primary: '#00363b'
  primary-container: '#4dbfcb'
  on-primary-container: '#004a51'
  inverse-primary: '#006971'
  secondary: '#f8bd2a'
  on-secondary: '#402d00'
  secondary-container: '#d9a200'
  on-secondary-container: '#533c00'
  tertiary: '#ffb9c3'
  on-tertiary: '#660025'
  tertiary-container: '#ff8ea3'
  on-tertiary-container: '#890035'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#87f3ff'
  primary-fixed-dim: '#68d6e3'
  on-primary-fixed: '#002023'
  on-primary-fixed-variant: '#004f55'
  secondary-fixed: '#ffdfa0'
  secondary-fixed-dim: '#f8bd2a'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5c4300'
  tertiary-fixed: '#ffd9de'
  tertiary-fixed-dim: '#ffb2be'
  on-tertiary-fixed: '#400014'
  on-tertiary-fixed-variant: '#900038'
  background: '#0d131f'
  on-background: '#dde2f3'
  surface-variant: '#2f3542'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-bold:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 24px
  margin: 32px
---

## Brand & Style

This design system is built on a "Neo-Maker" aesthetic—a fusion of high-contrast brutalism and playful, community-driven creativity. It is designed to feel like a workshop: tactile, energetic, and unapologetically bold. The brand personality is resourceful and approachable, aiming to lower the barrier to entry for creators while maintaining a professional technical edge.

The visual style utilizes heavy outlines and vibrant "sticker-like" elements to create a UI that feels physically constructed. By moving away from corporate gradients and towards flat, chunky surfaces, the system prioritizes clarity and a sense of "hand-made" digital craftsmanship.

## Colors

The palette is anchored by a deep **Dark Slate (#1A202C)** background, which provides a high-contrast stage for the brand's primary accents to vibrate against. 

- **Primary Teal (#4DBFCB):** Used for primary actions, success states, and technical highlights.
- **Secondary Yellow (#FBC02D):** Used for attention-grabbing elements, warnings, and "spark" moments of inspiration.
- **Tertiary Pink (#E91E63):** Used for secondary actions, interactive hover states, and playful decorative accents.
- **Surface Accents:** Use a slightly lighter slate (#2D3748) for card backgrounds to maintain depth without losing the dark aesthetic.

## Typography

The typography utilizes **Space Grotesk** across all levels to reinforce the technical, "maker" feel. Its geometric construction echoes the precision of machinery, while its quirky terminals add a friendly, human touch.

Headlines should be set with tight leading and slight negative letter-spacing to create a high-impact, "poster-like" feel. Body text remains spacious to ensure readability against dark backgrounds. Use the bold weight for labels and buttons to mimic the thickness of the UI borders.

## Layout & Spacing

The system uses a **fixed-column grid** for large screens (12 columns) and a **fluid layout** for smaller devices. The rhythm is strictly 4px-based to ensure all elements align with the "blocky" nature of the design components.

Margins and gutters are intentionally generous (24px+) to prevent the high-contrast elements from feeling cluttered. Content blocks should be treated as "modules" on a workbench, with clear separation and rhythmic consistency.

## Elevation & Depth

This system avoids soft, naturalistic shadows. Instead, it uses **Hard Displacement Shadows** and **Chunky Borders** to convey depth.

- **Level 0 (Base):** Dark Slate background.
- **Level 1 (Cards):** Surface color with a 2px solid border (Teal or White at 20% opacity).
- **Level 2 (Interactive):** Elements feature a "Hard Shadow"—a solid 4px offset in a contrasting brand color (Yellow or Pink) that does not blur, creating a 3D effect similar to a physical cutout.
- **Overlays:** Use high-opacity backdrops (80% Dark Slate) to keep the focus on the modal content without losing the "Maker" environment.

## Shapes

The shape language is defined by **chunky, friendly geometry**. Every container and button must have a visible 2px to 3px solid border.

Icons and decorative elements (the wrench, hammer, pencil, and lightbulb) should be used as oversized background watermarks or floating "sticker" elements. These icons should share the same stroke weight as the UI borders to maintain a cohesive visual language.

## Components

- **Buttons:** Bold, primary-colored backgrounds with a 2px black or dark navy border. On hover, the button should shift 2px down and right, "covering" its hard shadow to simulate a physical press.
- **Cards:** Use a "sticker" approach. Large rounded corners (1rem), thick borders, and an optional decorative icon from the logo set in the top-right corner.
- **Chips:** Pill-shaped with high-contrast backgrounds (Yellow for tags, Teal for status). Use bold, all-caps typography for labels.
- **Input Fields:** Darker than the card surface with a 2px border that turns Teal on focus. Labels should sit "above" the border line, similar to technical blueprints.
- **Iconography:** Use thick-stroke line icons that match the logo's illustrative style. Avoid thin or filled "corporate" icons.
- **Progress Bars:** Chunky and segmented, looking like a physical scale or ruler.