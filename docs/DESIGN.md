# Aalthara — design

- **Design system** (tokens, brand book, components, logos): https://claude.ai/artifact/Kz6s5xVUrQWPvk1LQ3qEdR
- **App screens** for iOS and Android: https://claude.ai/artifact/8BFvadZ6DeX1hhjxk8c6WV
- Tokens in this repo: `design/tokens.json` (same file as the design system's). Logos: `design/logo/`.

## The idea

An *aalthara* is the stone platform around a banyan where a village sits together. The mark is a banyan whose canopy is five people in branch colours, on a two-step platform. Two rules carry the identity through the product:

1. **People are discs; nothing else is.** Every person is a circle filled with their branch colour.
2. **Colour means something.** Six branch colours (chethi, vazha, kayal, mazha, chakka, kadalas) identify the family's branches. Turmeric yellow (manjal) marks the one thing to notice on a screen. Everything else is rice white, banyan-bark ink and banyan green.

## Elder-first rules (bugs if broken)

1. Body text 18px; nothing below 15px. System font scale honoured to 160%; names wrap, never truncate.
2. Every tappable thing ≥ 56×56px, with a text label. Icon-only buttons only for Back and Close, with accessibility labels.
3. One primary action per screen, full width at the bottom.
4. No hamburger menus, long-press, swipe-only actions or auto-dismissing messages for anything that matters.
5. Nothing moves on its own. Transitions ≤ 200ms; Reduce Motion respected.
6. Contrast: text ≥ 4.5:1 (the core trio is ≥ 7:1), control borders ≥ 3:1. State never by colour alone.
7. Four tabs, always: Home, Tree, Find, Me.
8. Errors say what happened and what to do, in a sentence, next to the thing.

## Platform manners

| | iOS | Android |
|---|---|---|
| Navigation | Floating pill tab bar; selected tab a filled brand capsule | Full-width bar on `sunk`; selected icon in a `brand-tint` pill |
| Titles | Large left-aligned title that collapses on scroll | Top app bar; family switcher chip at right |
| Add | Button in content | Manjal extended FAB with label |
| Forms | Bottom sheet with grabber | Full-screen dialog; Close at left, Save at right |
| Lists | Inset rounded cards | Edge-to-edge rows with dividers |
| Back | Chevron + previous title; swipe back works | Arrow; system/predictive back works |

Tablet and web from 840px: left rail instead of bottom bar; list on the left, person or tree on the right.

## Type and icons

Anek Malayalam (titles; one design for Malayalam and Latin) and Atkinson Hyperlegible Next (text; drawn for low-vision readers). Bundle both in the apps. Icons: Phosphor regular, 28px, 2px stroke, always labelled.

## Voice

Plain, warm, short; Malayalam is a first language, not a translation. See the design system README for the word list ("Husband or wife", not "Spouse"; "Save", not "Submit"). Relations are shown as "അമ്മാവൻ · Mother's brother".
