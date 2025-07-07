# Migration from Next.js to React

This document describes the changes made to migrate the application from Next.js to React.

## Changes Made

1. Removed "use client" directives from all files
2. Replaced Next.js specific imports with React equivalents:
    - Replaced `useRouter` from "next/navigation" with `useNavigate` from "react-router-dom"
    - Replaced `usePathname` from "next/navigation" with `useLocation` from "react-router-dom"
    - Replaced Inter font from "next/font/google" with a standard web font import in CSS
    - Removed Metadata type from "next"
    - Replaced `useTheme` from "next-themes" with a custom theme detection using media queries

3. Updated layout.tsx to be a standard React component
4. Updated App.tsx to integrate the pages directory with the routing system
5. Added Inter font import to globals.css

## Folder Structure

The folder structure has been preserved as required. No files have been merged or moved.

## Testing

To test the application, run:

```bash
npm run dev
```

This will start the development server and you can access the application at http://localhost:5173.

You can also run the test script to ensure the application works correctly:

```bash
npx vite --config vite.config.ts
```

## Known Issues

- Some components may still contain "use client" directives that need to be removed
- Some components may still use Next.js specific imports that need to be replaced
- The application may not work correctly if there are dependencies on Next.js features that haven't been replaced

## Next Steps

1. Remove "use client" directives from all remaining files
2. Replace any remaining Next.js specific imports with React equivalents
3. Test the application thoroughly to ensure it works correctly