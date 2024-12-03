# Enhanced Font Analyzer

A powerful and interactive tool for analyzing font usage across web pages. This utility provides both interactive and
headless modes for comprehensive font analysis, with features for real-time font detection, detailed metrics
visualization, and hierarchical font usage analysis.

## 🌟 Features

- **Interactive Font Detection**: Hover over any text element to see its font details in real-time
- **Detailed Font Metrics**: View comprehensive information about fonts including:
    - Font family
    - Weight
    - Style
    - Size
    - Color
    - Line height
    - Letter spacing
- **Element Highlighting**: Click to highlight specific elements and compare multiple font implementations
- **Hierarchical Analysis**: Analyze font usage patterns throughout the DOM tree
- **Debug Mode**: Advanced debugging capabilities with real-time updates
- **Font Usage Statistics**: Generate detailed reports about font distribution across your pages

## 🚀 Getting Started

### Installation

```html

<script src="enhanced-font-analyzer.js"></script>
```

### Basic Usage

```javascript
// Initialize interactive analysis mode
EnhancedFontAnalyzer.analyzeInteractive();

// Or run a headless analysis
const report = EnhancedFontAnalyzer.analyzeHeadless();
```

### Debug Mode

Enable debug mode for additional insights:

```javascript
EnhancedFontAnalyzer.setDebug({
    enabled: true,
    logLevel: 'debug',
    showDebugPanel: true
});
```

## 🔍 API Reference

### Core Methods

#### `analyzeInteractive()`

Activates the interactive font analysis mode, allowing users to hover over and click elements to view font details.

#### `analyzeHeadless()`

Performs a complete font analysis without user interaction, returning a detailed report.

#### `setDebug(config)`

Configures debug settings for enhanced monitoring and troubleshooting.

### Data Structures

#### FontMetrics Interface

```typescript
interface FontMetrics {
    name: string;
    weight: number;
    style: string;
    size: string;
    color: string;
    lineHeight: string;
    letterSpacing: string;
    category?: string;
}
```

#### FontAnalysisReport Interface

```typescript
interface FontAnalysisReport {
    hierarchy: FontHierarchyData[];
    fontUsageStats?: Map<string, number>;
}
```

## 🛠️ Advanced Features

### Font Hierarchy Analysis

The analyzer builds a complete hierarchy of font usage throughout your document, helping you understand:

- Font inheritance patterns
- Usage frequency
- Style variations
- Inconsistencies in implementation

### Real-time Updates

The analyzer includes mutation observers to track dynamic content changes, ensuring accurate analysis even in
single-page applications or dynamic websites.

### Debug Panel

When enabled, the debug panel provides:

- Real-time tracking of analyzed elements
- Active modal information
- Element highlight status
- Z-index management details

## 🎨 UI Features

- **Floating Tooltips**: Quick font information on hover
- **Detailed Modals**: Comprehensive font metrics in movable windows
- **Element Highlighting**: Visual identification of analyzed elements
- **Instruction Tooltips**: Helpful onboarding information for new users

## 🔧 Configuration

### Debug Configuration

```typescript
interface DebugConfig {
    enabled: boolean;
    logLevel: 'info' | 'debug' | 'verbose';
    showDebugPanel: boolean;
}
```

## 🚫 Limitations

- Excludes certain elements by default (script, style, meta, etc.)
- Font loading time measurements may vary based on browser caching
- Some web fonts may require additional configuration for accurate detection

## 📄 License

This project is licensed under the MIT License - see the LICENSE.md file for details.
