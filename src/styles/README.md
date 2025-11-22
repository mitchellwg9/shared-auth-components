# Shared Auth Design System

This package includes a complete design system based on the TymTrackr design system, providing consistent styling across all your applications.

## Usage

### Import in Your App

#### Option 1: Import Base Styles (Recommended)
```javascript
// In your main entry point (e.g., main.jsx, App.jsx)
import '@wayne/shared-auth/styles/base.css';
```

This imports:
- Google Fonts (Inter, JetBrains Mono)
- Design system CSS variables
- Base styles and utility classes

#### Option 2: Import Design System Only
```javascript
// If you want to handle fonts separately
import '@wayne/shared-auth/styles/design-system.css';
```

### Use Theme in JavaScript/TypeScript

```javascript
import { theme } from '@wayne/shared-auth';

// Access theme tokens programmatically
const primaryColor = theme.colors.primary[500];
const spacing = theme.spacing[4];
```

### CSS Variables

All design tokens are available as CSS custom properties:

```css
.my-component {
  background: var(--primary-500);
  color: var(--gray-900);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

### Utility Classes

The design system includes utility classes:

- **Typography**: `.text-xs`, `.text-sm`, `.text-base`, `.text-lg`, `.text-xl`, `.text-2xl`, etc.
- **Font weights**: `.font-light`, `.font-normal`, `.font-medium`, `.font-semibold`, `.font-bold`
- **Buttons**: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-success`, `.btn-danger`, `.btn-ghost`
- **Inputs**: `.input`, `.input-group`
- **Cards**: `.card`, `.card-elevated`, `.card-interactive`
- **Badges**: `.badge`, `.badge-primary`, `.badge-success`, `.badge-warning`, `.badge-error`
- **Animations**: `.animate-pulse`, `.animate-bounce`, `.animate-spin`

### Customization

You can override CSS variables in your app:

```css
:root {
  --primary-500: #your-color;
  --font-sans: 'Your Font', sans-serif;
}
```

## Design Tokens

### Colors
- **Primary**: Blue scale (50-900)
- **Accent**: Emerald, Amber, Rose, Purple, Indigo
- **Neutral**: Gray scale (50-900)
- **Status**: Success, Warning, Error

### Typography
- **Sans**: Inter (default)
- **Mono**: JetBrains Mono

### Spacing
Scale from 0.25rem (1) to 5rem (20)

### Border Radius
- sm, md, lg, xl, 2xl, full

### Shadows
- sm, md, lg, xl, 2xl

### Transitions
- fast (150ms), normal (250ms), slow (350ms)

