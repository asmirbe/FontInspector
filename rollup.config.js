import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import cleanup from "rollup-plugin-cleanup";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";

const isProduction = process.env.NODE_ENV === "production";

export default {
	input: "src/index.ts",
	output: {
		file: "dist/bundle.js",
		format: "iife",
		name: "EnhancedFontAnalyzer",
		extend: true,
		globals: {
			window: "window",
		},
		sourcemap: !isProduction,
	},
	plugins: [
		replace({
			preventAssignment: true,
			"process.env.NODE_ENV": JSON.stringify(isProduction ? "production" : "development"),
		}),
		resolve({
			browser: true,
			preferBuiltins: false,
		}),
		commonjs({
			include: "node_modules/**",
		}),
		typescript({
			tsconfig: "./tsconfig.json",
		}),
		cleanup({
			comments: "none",
			extensions: ["js", "ts", "tsx"],
			sourcemap: !isProduction,
		}),
		isProduction &&
			terser({
				format: {
					comments: false,
				},
				compress: {
					drop_console: true,
					drop_debugger: true,
				},
			}),
	].filter(Boolean),
};
