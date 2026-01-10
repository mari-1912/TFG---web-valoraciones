/** @type {import('tailwindcss').Config} */
export default {
    darkMode: "class", // importante para usar la clase .dark
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
      extend: {
        colors: {
          bg: {
            DEFAULT: "hsl(var(--color-bg) / <alpha-value>)",
            soft: "hsl(var(--color-bg-soft) / <alpha-value>)",
          },
          surface: {
            DEFAULT: "hsl(var(--color-surface) / <alpha-value>)",
            elevated: "hsl(var(--color-surface-elevated) / <alpha-value>)",
          },
          border: {
            subtle: "hsl(var(--color-border-subtle) / <alpha-value>)",
            strong: "hsl(var(--color-border-strong) / <alpha-value>)",
          },
          text: {
            DEFAULT: "hsl(var(--color-text) / <alpha-value>)",
            soft: "hsl(var(--color-text-soft) / <alpha-value>)",
            muted: "hsl(var(--color-text-muted) / <alpha-value>)",
          },
          primary: {
            DEFAULT: "hsl(var(--color-primary) / <alpha-value>)",
            soft: "hsl(var(--color-primary-soft) / <alpha-value>)",
            strong: "hsl(var(--color-primary-strong) / <alpha-value>)",
          },
          accent: {
            DEFAULT: "hsl(var(--color-accent) / <alpha-value>)",
            soft: "hsl(var(--color-accent-soft) / <alpha-value>)",
            strong: "hsl(var(--color-accent-strong) / <alpha-value>)",
          },
          state: {
            success: "hsl(var(--color-success) / <alpha-value>)",
            warning: "hsl(var(--color-warning) / <alpha-value>)",
            danger: "hsl(var(--color-danger) / <alpha-value>)",
          },
        },
        boxShadow: {
          soft: "var(--shadow-soft)",
          strong: "var(--shadow-strong)",
        },
        borderRadius: {
          lg: "var(--radius-lg)",
          xl: "var(--radius-xl)",
        },
        backgroundImage: {
            header: "var(--gradient-primary)",
        },
      },
    },
    plugins: [],
  };
  