'use client'; // Required in Next.js App Router for client-side rendering

import React from 'react';
import { AuthProvider } from '../components/useAuth'; // Context provider for authentication
import { SettingsProvider } from '../components/useSettings'; // Context provider for gameplay settings
import RootLayout from './layout'; // Root layout component for consistent page structure
import '../styles/globals.css'; // Global CSS styles

/**
 * App Component
 * 
 * This is the custom `_app.tsx` file in a Next.js application. It serves as the entry point for rendering
 * all pages in the application. The component wraps every page with global providers and layouts.
 * 
 * Key Features:
 * - Wraps all pages with an `AuthProvider` to provide authentication context.
 * - Includes a `RootLayout` component for consistent layout across pages.
 * - Ensures global CSS styles are applied throughout the application.
 * 
 * Props:
 * - `Component`: The current page component being rendered.
 * - `pageProps`: Props specific to the current page.
 */
const App = ({
  Component, // The page component to be rendered
  pageProps, // Props specific to the current page
}: {
  Component: React.ElementType; // Type definition for the page component
  pageProps: any; // Type definition for page-specific props
}) => {
  return (
    /**
     * AuthProvider:
     * - Provides authentication context to the entire application.
     * - Ensures any component or page can access authentication state and methods.
     */
    <AuthProvider>
      <SettingsProvider>
        {/**
         * RootLayout:
         * - Wraps the entire application with a consistent layout structure.
         * - Typically includes common elements like header, footer, or side navigation.
         */}
        <RootLayout>
          {/**
           * Component:
           * - The specific page being rendered (e.g., Home, About, etc.).
           * - Spread `pageProps` are passed to ensure the page receives its required props.
           */}
          <Component {...pageProps} />
        </RootLayout>
      </SettingsProvider>
    </AuthProvider>
  );
};

export default App; // Export the App component as the default export
