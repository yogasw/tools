# AI Context & Development Rules

## Project Overview
This is a **Tools Collection** web application - a modular, modern collection of useful web tools built with Svelte and Tailwind CSS.

## Tech Stack
- **Framework**: Svelte 5.x
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v3+
- **Language**: JavaScript (ES6+)
- **Package Manager**: npm

## Color Scheme & Theme
- **Design Style**: Modern with gradient backgrounds and glassmorphism effects
- **Primary Colors**: Blue to Purple gradient (`from-blue-600 via-purple-600 to-pink-600`)
  - primary-50 to primary-950 (defined in tailwind.config.js)
  - Main accent: `primary-600` for light mode, `primary-400` for dark mode
- **Background Colors**:
  - Light mode: Gradient `from-gray-50 via-blue-50 to-purple-50`
  - Dark mode: `from-gray-900 via-gray-900 to-gray-900`
  - Cards: `bg-white dark:bg-gray-800` with shadows
- **Text Colors**:
  - Light mode: `text-gray-900`, `text-gray-600`
  - Dark mode: `text-gray-100`, `text-gray-400`
- **Theme System**: Supports dark and light mode using `class`-based dark mode (Tailwind)
- **UI Effects**:
  - Glassmorphism on header (`backdrop-blur-lg`)
  - Gradient overlays on hover
  - Smooth transitions and animations
  - Card hover effects (scale, shadow, translate)

## Routing System
- **Type**: Hash-based routing (`#/tool-name`)
- **Router Store**: `src/lib/stores/router.js`
- **Features**:
  - SEO-friendly URLs for each tool
  - Browser history support
  - Direct access to tools via URL
  - Dynamic page titles based on current route
  - Dynamic meta descriptions
- **Usage**:
  - Home: `#/` or no hash
  - Tool pages: `#/base64`, `#/camera-mic-test`, `#/wa-link-generator`
  - Navigate using `navigate(path)` function from router store

## Project Structure
```
src/
├── lib/
│   ├── components/       # Reusable UI components
│   │   ├── Button.svelte
│   │   ├── Card.svelte
│   │   ├── Input.svelte
│   │   ├── Textarea.svelte
│   │   ├── ThemeToggle.svelte
│   │   └── ToolCard.svelte
│   ├── tools/           # Tool modules (each tool is a Svelte component)
│   │   ├── Base64Tool.svelte
│   │   └── WhatsAppLinkGenerator.svelte
│   ├── stores/          # Svelte stores for state management
│   │   ├── theme.js     # Theme management (dark/light mode)
│   │   ├── tools.js     # Tools registry
│   │   └── router.js    # Hash-based routing system
│   └── utils/           # Utility functions (currently empty)
├── App.svelte           # Main app component with routing
├── app.css              # Global CSS with Tailwind directives
└── main.js              # App entry point
```

## Development Guidelines

### 1. Adding New Tools
To add a new tool to the collection:

1. **Create the tool component** in `src/lib/tools/YourTool.svelte`
2. **Register the tool** in `src/lib/stores/tools.js`:
   ```javascript
   {
     id: 'your-tool-id',
     name: 'Your Tool Name',
     description: 'Brief description',
     icon: '🔧', // emoji icon
     type: 'internal', // or 'external'
     category: 'category-name'
   }
   ```
3. **Import and register** in `src/App.svelte`:
   ```javascript
   import YourTool from './lib/tools/YourTool.svelte';

   const toolComponents = {
     // ...existing tools
     'your-tool-id': YourTool
   };
   ```

**Note**: The tool will automatically:
- Appear in the home page grid
- Get its own URL route at `#/your-tool-id`
- Be searchable
- Have a dynamic page title
- Support browser back/forward navigation

### 2. Component Best Practices

#### Reusable Components
All reusable components are in `src/lib/components/`. Use these consistently:
- **Button**: For all buttons (supports variants: primary, secondary, outline, ghost)
- **Card**: For content containers
- **Input**: For single-line text inputs
- **Textarea**: For multi-line text inputs

#### Tool Components Structure
Each tool should follow this pattern:
```svelte
<script>
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  // ... other imports

  // Tool state and logic here
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
      Tool Name
    </h2>
    <p class="text-gray-600 dark:text-gray-400">
      Tool description
    </p>
  </div>

  <Card>
    <!-- Tool UI here -->
  </Card>
</div>
```

### 3. Styling Guidelines

#### Dark Mode
- Always provide both light and dark mode styles using Tailwind's `dark:` prefix
- Common pattern: `bg-white dark:bg-gray-800`
- Text: `text-gray-900 dark:text-gray-100`
- Borders: `border-gray-200 dark:border-gray-700`

#### Spacing & Layout
- Use Tailwind spacing utilities (`space-y-*`, `gap-*`, `p-*`, `m-*`)
- Prefer `space-y-6` for vertical spacing between sections
- Use `space-y-4` for spacing within cards

#### Responsive Design
- Mobile-first approach
- Use responsive prefixes: `md:`, `lg:`, etc.
- Grid layouts: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

### 4. State Management
- Use Svelte stores for global state (theme, tools registry)
- Use component-level reactive variables for local state
- Store files go in `src/lib/stores/`

### 5. Theme System
- Theme is managed by `src/lib/stores/theme.js`
- Persists to localStorage
- Respects system preferences on first load
- Use `ThemeToggle` component for theme switching

### 6. Code Style
- Use ES6+ features
- Prefer `const` over `let` when possible
- Use template literals for string interpolation
- Use async/await for asynchronous operations
- Add error handling for user-facing operations

### 7. User Experience
- Provide clear error messages
- Show loading states when needed
- Add success feedback (e.g., "Copied!" notifications)
- Make buttons and interactive elements accessible
- Use semantic HTML

## External Tools
Tools can be marked as `type: 'external'` in the registry. These link to external URLs instead of internal components. Implement this by:
1. Adding the tool to `toolsRegistry` with `type: 'external'` and a `url` field
2. Modifying the routing logic to handle external URLs

## Performance Considerations
- Lazy load tool components if the collection grows large
- Optimize images and assets
- Use Vite's code splitting features
- Keep bundle size small

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ support required
- MediaDevices API for camera/mic tools
- Clipboard API for copy functionality

## Deployment

### GitHub Pages Auto Deployment
The project is configured for automatic deployment to GitHub Pages via GitHub Actions.

**Workflow**: `.github/workflows/deploy.yml`
- Triggers on push to `main` or `master` branch
- Can also be triggered manually via workflow_dispatch
- Builds the project and deploys to GitHub Pages

**Base Path Configuration**:
- Production (GitHub Pages): `/tools/` (configured in `vite.config.js`)
- Development: `/` (set via `VITE_BASE_PATH` environment variable)

**Setup Requirements**:
1. Enable GitHub Pages in repository settings
2. Set source to "GitHub Actions"
3. Ensure GitHub Actions has necessary permissions

### Custom Domain
To use a custom domain:
1. Add `CNAME` file to `public/` directory
2. Update `base` in `vite.config.js` to `/` or appropriate path
3. Configure DNS settings

## Future Improvements
- Add search/filter for tools
- Add categories/tags system
- Implement URL routing (e.g., `/tools/base64`)
- Add tool usage analytics
- Export/import tool configurations
- PWA support

## Common Commands
```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Install dependencies
npm install
```

## Notes for AI Assistants
- Always use the existing component library before creating new components
- Maintain consistent styling with dark mode support
- Follow the established project structure
- Update this document when adding new patterns or conventions
- Keep the tools simple and focused on one task each
- Prioritize user experience and accessibility
