import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
	],
	build: {
		outDir: "dist",
		emptyOutDir: true,
		rollupOptions: {
			input: {
				main: "./sidebar.html",
				background: "./src/lib/background.ts",
				content: "./src/lib/content.ts",
				"search-content": "./src/lib/search-content.ts",
				"intelligence-content": "./src/lib/intelligence-content.ts",
			},
			output: {
				entryFileNames: (chunkInfo) => {
					if (chunkInfo.name === "background") {
						return "background.js";
					}
					if (chunkInfo.name === "content") {
						return "content.js";
					}
					if (chunkInfo.name === "search-content") {
						return "search-content.js";
					}
					if (chunkInfo.name === "intelligence-content") {
						return "intelligence-content.js";
					}
					return "[name].js";
				},
				format: "es",
				manualChunks: undefined,
			},
			external: () => false,
			plugins: [
				{
					name: "wrap-content-script",
					generateBundle(_options, bundle) {
						// Find content scripts and wrap them in IIFE
						const contentScript = bundle["content.js"];
						if (contentScript && contentScript.type === "chunk") {
							contentScript.code = `(function() {\n'use strict';\n${contentScript.code}\n})();`;
						}
						const searchScript = bundle["search-content.js"];
						if (searchScript && searchScript.type === "chunk") {
							searchScript.code = `(function() {\n'use strict';\n${searchScript.code}\n})();`;
						}
						const intelligenceScript = bundle["intelligence-content.js"];
						if (intelligenceScript && intelligenceScript.type === "chunk") {
							intelligenceScript.code = `(function() {\n'use strict';\n${intelligenceScript.code}\n})();`;
						}
					},
				},
			],
		},
	},
});
