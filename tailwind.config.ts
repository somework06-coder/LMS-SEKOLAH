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
                "primary": "#10B981", // Mint Green
                "primary-dark": "#059669", // Dark Mint
                "secondary": "#64748B", // Slate
                "background-light": "#F1F5F9", // Light Slate Background
                "background-dark": "#0F172A", // Dark Slate
                "surface-light": "#ffffff",
                "surface-dark": "#1E293B", // Dark Slate Surface
                "text-main": "#0F172A", // Dark Slate Text
                "text-secondary": "#64748B", // Slate Grey Text
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
                "soft": "0 8px 24px -6px rgba(100, 116, 139, 0.12)",
                "card": "0 4px 12px rgba(100, 116, 139, 0.05)",
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
