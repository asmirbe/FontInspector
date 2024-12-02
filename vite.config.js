import { defineConfig } from "vite";
import cleanup from "rollup-plugin-cleanup";

export default defineConfig(({ mode }) => {
	const isProduction = mode === "production";

	return {
		build: {
			lib: {
				entry: "src/index.ts",
				name: "EnhancedFontAnalyzer",
				formats: ["iife"],
				fileName: () => "bundle.js",
			},
			sourcemap: !isProduction,
			minify: "terser",
			rollupOptions: {
				output: {
					extend: true,
					globals: {
						window: "window",
					},
				},
				plugins: [
					cleanup({
						comments: "none",
						extensions: ["js", "ts", "tsx"],
						sourcemap: !isProduction,
					}),
				].filter(Boolean),
			},
		},
		define: {
			"process.env.NODE_ENV": JSON.stringify(isProduction ? "production" : "development"),
		},
	};
});
