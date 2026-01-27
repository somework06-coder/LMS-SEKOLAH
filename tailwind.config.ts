import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: 'class', // Enable class-based dark mode
    theme: {
        extend: {
            colors: {
                "primary": "#6B8E6B", // Muted Sage Green
                "primary-dark": "#4A634A", // Earthy Deep Green
                "secondary": "#A8BC9F", // Softer Sage
                "background-light": "#E5EBE0", // Soft sage background with good card contrast
                "background-dark": "#1A1F1A", // Dark forest background
                "surface-light": "#ffffff",
                "surface-dark": "#242B24",
                "text-main": "#1B2E1B", // Dark Forest Green
                "text-secondary": "#5C6B5C", // Deep Warm Grey-Green
            },
            fontFamily: {
                "display": ["Lexend", "sans-serif"],
                "sans": ["Lexend", "sans-serif"], // Set as default sans
            },
            borderRadius: {
                "DEFAULT": "1rem",
                "lg": "1.5rem",
                "xl": "2rem",
                "2xl": "2.5rem",
                "full": "9999px"
            },
            boxShadow: {
                "soft": "0 8px 24px -6px rgba(107, 142, 107, 0.12)",
                "card": "0 4px 12px rgba(27, 46, 27, 0.05)",
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        // Add other plugins if needed
    ],
};
export default config;
