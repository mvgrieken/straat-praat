# App Assets Conversion Guide

This directory contains SVG source files for all Straat-Praat app assets. These need to be converted to PNG format for use in the Expo app.

## Required Conversions

| Source File | Target File | Dimensions | Purpose |
|-------------|-------------|------------|---------|
| `icon.svg` | `icon.png` | 1024×1024 | Main app icon |
| `splash.svg` | `splash.png` | 1242×2688 | iOS splash screen |
| `adaptive-icon.svg` | `adaptive-icon.png` | 432×432 | Android adaptive icon foreground |
| `favicon.svg` | `favicon.png` | 32×32 | Web favicon |
| `notification-icon.svg` | `notification-icon.png` | 96×96 | Push notification icon |

## Conversion Methods

### Option 1: Using ImageMagick (Command Line)
```bash
# Install ImageMagick first
# Then convert each file:
magick icon.svg -resize 1024x1024 icon.png
magick splash.svg -resize 1242x2688 splash.png
magick adaptive-icon.svg -resize 432x432 adaptive-icon.png
magick favicon.svg -resize 32x32 favicon.png
magick notification-icon.svg -resize 96x96 notification-icon.png
```

### Option 2: Using Inkscape (Command Line)
```bash
# Install Inkscape first
# Then convert each file:
inkscape --export-filename=icon.png --export-width=1024 --export-height=1024 icon.svg
inkscape --export-filename=splash.png --export-width=1242 --export-height=2688 splash.svg
inkscape --export-filename=adaptive-icon.png --export-width=432 --export-height=432 adaptive-icon.svg
inkscape --export-filename=favicon.png --export-width=32 --export-height=32 favicon.svg
inkscape --export-filename=notification-icon.png --export-width=96 --export-height=96 notification-icon.svg
```

### Option 3: Online Converters
Use online SVG to PNG converters like:
- convertio.co
- cloudconvert.com
- freeconvert.com

Make sure to set the correct output dimensions for each file.

### Option 4: Design Tools
Open each SVG in:
- Adobe Illustrator
- Figma
- Sketch
- Canva

Then export as PNG with the specified dimensions.

## Design Notes

- **Primary Color**: #0ea5e9 (Tailwind blue-500)
- **Theme**: Communication, learning, speech bubbles
- **Style**: Modern, friendly, approachable
- **Elements**: 
  - Speech bubble as main visual metaphor
  - "SP" letters for Straat-Praat branding
  - Clean, minimal design suitable for all sizes

## After Conversion

1. Delete the SVG files (keep only PNGs for the app)
2. Update `app.json` to reference the PNG files
3. Test the icons in Expo development build
4. Verify icons display correctly on iOS, Android, and Web

## App.json Configuration

Make sure your `app.json` includes:

```json
{
  "expo": {
    "icon": "./assets/images/icon.png",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0ea5e9"
    },
    "web": {
      "favicon": "./assets/images/favicon.png"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#0ea5e9"
      }
    },
    "notification": {
      "icon": "./assets/images/notification-icon.png"
    }
  }
}
```