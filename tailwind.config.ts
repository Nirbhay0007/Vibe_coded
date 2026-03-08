import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#020617",
                foreground: "#cbd5e1", // slate-300
                canvas: "#020617",
                panel: "#0D0D0D",
                neon: {
                    cyan: "#00E5FF",
                    teal: "#008080",
                    red: "#FF3131",
                    fuchsia: "#FF00FF",
                    amber: "#FFB300"
                }
            },
            fontFamily: {
                mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
                sans: ['Inter', 'Geist', 'sans-serif'],
            },
            boxShadow: {
                'glow-cyan': '0 0 15px rgba(0,229,255,0.1)',
                'glow-cyan-hover': '0 0 10px rgba(0,229,255,0.3)',
            },
            animation: {
                'ping-osint': 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
            }
        },
    },
    plugins: [],
};
export default config;
