import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import FontInspector from "./CoreForeInspector";

describe("FontInspector", () => {
	let inspector: FontInspector;
	let mockElement: HTMLElement;

	beforeEach(() => {
		inspector = new FontInspector();
		mockElement = document.createElement('div');

		// Properly mock element dimensions
		Object.defineProperty(mockElement, 'offsetHeight', { value: 100 });
		Object.defineProperty(mockElement, 'offsetWidth', { value: 100 });

		const mockStyle = {
			...getComputedStyle(document.createElement('div')),
			fontFamily: 'Arial, sans-serif',
			fontWeight: '400',
			fontSize: '16px',
			color: '#000000',
			display: 'block',
			visibility: 'visible',
			opacity: '1'
		} as CSSStyleDeclaration;

		(window.getComputedStyle as jest.Mock) = jest.fn().mockReturnValue(mockStyle);
	});

	describe("standardizeFontName", () => {
		it("should handle empty input", () => {
			const result = inspector["standardizeFontName"]("");
			expect(result).toBe("System Default");
		});

		it("should standardize font names correctly", () => {
			expect(inspector["standardizeFontName"]("arial")).toBe("Arial");
			expect(inspector["standardizeFontName"]("TIMES NEW ROMAN")).toBe("Times New Roman");
			expect(inspector["standardizeFontName"]("monospace")).toBe("Monospace");
		});
	});

	describe("element analysis", () => {
		it("should identify visible elements", () => {
			expect(inspector["isElementVisible"](mockElement)).toBe(true);

			const hiddenStyle = {
				...getComputedStyle(document.createElement('div')),
				display: "none"
			};
			(window.getComputedStyle as jest.Mock) = jest.fn().mockReturnValue(hiddenStyle);
			expect(inspector["isElementVisible"](mockElement)).toBe(false);
		});

		it("should check text content", () => {
			mockElement.textContent = "test";
			expect(inspector["hasTextContent"](mockElement)).toBe(true);

			mockElement.textContent = "";
			expect(inspector["hasTextContent"](mockElement)).toBe(false);
		});
	});

	describe("font metrics", () => {
		it("should cache and retrieve metrics", async () => {
			const metrics = await inspector["getElementFontMetrics"](mockElement);
			expect(metrics).toBeTruthy();
			expect(metrics?.name).toBe("Arial");

			const cachedMetrics = await inspector["getElementFontMetrics"](mockElement);
			expect(cachedMetrics).toEqual(metrics);
		});
	});
});