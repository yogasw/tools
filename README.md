# Tools Collection

A simple and modern collection of useful web tools built with Svelte and Tailwind CSS.

## Features

- **Modern UI**: Clean, responsive design with dark/light mode support
- **Modular Architecture**: Easy to add new tools
- **Fast**: Built with Vite for optimal performance
- **Accessible**: Keyboard navigation and screen reader friendly

## Current Tools

1. **Base64 Encoder/Decoder** 🔐
   - Encode text to Base64
   - Decode Base64 strings
   - Switch between modes easily

2. **Camera & Mic Test** 🎥
   - Test camera permissions and preview
   - Test microphone permissions with audio level visualization
   - Useful for debugging video call issues

3. **WhatsApp Link Generator** 💬
   - Generate WhatsApp click-to-chat links
   - Pre-fill messages
   - Support for international phone numbers

## Tech Stack

- **Svelte** - Reactive UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Adding New Tools

1. Create a new Svelte component in `src/lib/tools/`
2. Register the tool in `src/lib/stores/tools.js`
3. Import and add to the component mapping in `src/App.svelte`

See `AI-RULES.md` for detailed guidelines.

## Deployment

This project is configured for automatic deployment to GitHub Pages.

### Auto Deployment

The site automatically deploys to GitHub Pages when you push to the `main` or `master` branch.

**Setup Steps:**

1. Go to your GitHub repository settings
2. Navigate to **Pages** section
3. Under **Source**, select **GitHub Actions**
4. Push to `main` or `master` branch to trigger deployment

The deployment workflow is defined in `.github/workflows/deploy.yml`.

### Manual Deployment

You can also manually trigger the deployment:

1. Go to the **Actions** tab in your GitHub repository
2. Select **Deploy to GitHub Pages** workflow
3. Click **Run workflow**

### Custom Domain

To use a custom domain:

1. Add a `CNAME` file to the `public/` directory with your domain
2. Configure your domain's DNS settings to point to GitHub Pages
3. Update the `base` path in `vite.config.js` if needed

## Project Structure

```
src/
├── lib/
│   ├── components/     # Reusable UI components
│   ├── tools/         # Tool modules
│   ├── stores/        # State management
│   └── utils/         # Utility functions
├── App.svelte         # Main app
├── app.css           # Global styles
└── main.js           # Entry point
```

## Contributing

Feel free to add new tools or improve existing ones!

## License

MIT
