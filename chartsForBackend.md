# Victory Native Chart Generation Guide for Backend

## ⚠️ IMPORTANT: Charts Not Yet Implemented

**Status**: Chart rendering is currently disabled in the frontend. The infrastructure is ready, but Victory Native charts will be implemented in a future native build.

**For now**: The backend can continue generating chart configurations in the `content_slides.slides_chart_configs` field. They will be stored but not displayed until the next native build includes Victory Native.

---

## Victory Native Version (Future Implementation)

**Package**: `victory-native` v41.20.1 (Victory Native XL)

**Important**: This is Victory Native XL, which has a completely different API from the older Victory library. Do NOT use the old Victory documentation.

**Dependencies**:
- `@shopify/react-native-skia` v2.3.10
- `react-native-reanimated` v4.1.3

## Chart Type Reference

Victory Native XL supports the following chart types. **Choose the appropriate chart type based on the data you're presenting:**

### 1. `Bar` - Vertical Bar Charts
**Best for**: Comparing discrete categories, showing rankings, displaying frequency distributions

**When to use**:
- Comparing sales across different products
- Showing survey responses by category
- Displaying market share by company
- Year-over-year comparisons

**Data requirements**: 3-12 data points ideal (too many bars = cluttered)

### 2. `Line` - Line Charts
**Best for**: Showing trends over time, continuous data

**When to use**:
- Stock prices over time
- Temperature changes
- User growth metrics
- Performance trends

**Data requirements**: 5-20 data points minimum for meaningful trends

### 3. `Area` - Area Charts
**Best for**: Showing cumulative totals over time, emphasizing magnitude of change

**When to use**:
- Total revenue over time
- Cumulative user signups
- Market size growth
- Volume metrics

**Data requirements**: 6-25 data points for smooth curves

### 4. `Scatter` - Scatter Plots
**Best for**: Showing relationships between two variables, identifying correlations

**When to use**:
- Price vs. performance comparisons
- Correlation studies
- Distribution analysis
- Outlier identification

**Data requirements**: 10-50 data points minimum for meaningful patterns

### 5. `Pie` - Pie Charts
**Best for**: Showing parts of a whole (percentages)

**When to use**:
- Market share distribution
- Budget allocation
- Survey result percentages
- Demographic breakdowns

**Data requirements**: 2-6 slices maximum (too many = unreadable)

**WARNING**: Pie charts are often overused. Consider using Bar charts instead for better readability.

## Chart Configuration Format

The frontend expects chart configurations in this exact format in the `content_slides.slides_chart_configs` array:

```json
{
  "chartType": "Area",
  "data": [
    {"x": 1, "y": 10},
    {"x": 2, "y": 25},
    {"x": 3, "y": 40},
    {"x": 4, "y": 35},
    {"x": 5, "y": 55},
    {"x": 6, "y": 70}
  ],
  "style": {
    "data": {
      "stroke": "#4CAF50",
      "fill": "#4CAF50",
      "strokeWidth": 3
    }
  },
  "options": {}
}
```

### Chart Type Values

Use these **exact** strings for `chartType`:
- `"Bar"` or `"VictoryBar"` (both supported for backward compatibility)
- `"Line"` or `"VictoryLine"`
- `"Area"` or `"VictoryArea"`
- `"Scatter"` or `"VictoryScatter"`
- `"Pie"` or `"VictoryPie"`

### Data Format

**For Bar, Line, Area, Scatter**:
```json
"data": [
  {"x": 1, "y": 120},
  {"x": 2, "y": 340},
  {"x": 3, "y": 280}
]
```

**For Pie**:
```json
"data": [
  {"x": 1, "y": 35, "label": "Category A"},
  {"x": 2, "y": 45, "label": "Category B"},
  {"x": 3, "y": 20, "label": "Category C"}
]
```

**Important Requirements**:
- `x` values MUST be numbers (not strings)
- `y` values MUST be numbers (not strings)
- Include `label` for Pie charts
- Minimum 3 data points for most charts
- Maximum 30 data points (more = performance issues)

## Styling Guidelines

### Color Palette

Use these colors for professional, readable charts:

**Primary colors** (use for single-series data):
- `#4CAF50` - Green (growth, positive trends)
- `#2196F3` - Blue (neutral, technology)
- `#FF9800` - Orange (warning, attention)
- `#F44336` - Red (decline, negative trends)
- `#9C27B0` - Purple (premium, innovation)
- `#00BCD4` - Cyan (fresh, modern)

**Default color**: `#FFC107` (Gold - app's accent color)

### Style Configuration

```json
"style": {
  "data": {
    "stroke": "#4CAF50",      // Line/border color
    "fill": "#4CAF50",        // Fill color (bars, areas)
    "strokeWidth": 3          // Line thickness (2-4 recommended)
  }
}
```

**Recommendations**:
- Use `strokeWidth: 2` for subtle lines
- Use `strokeWidth: 3-4` for emphasis
- Match `stroke` and `fill` colors for consistency
- Use darker shades for lines, lighter for fills

## Data Quality Requirements

### ⚠️ CRITICAL: Use Real Data

**DO NOT** create fake or placeholder data. Charts must be:

1. **Factually accurate**: Based on real information from the article or reliable sources
2. **Contextually relevant**: Directly related to the article's content
3. **Properly sourced**: Use data from the article itself, or search the web for authoritative data
4. **Appropriately scaled**: Use realistic values and ranges

### How to Source Data

**Priority 1**: Extract data from the article text
- Look for numbers, statistics, percentages, trends mentioned
- Parse tables or data sections
- Extract time-series information

**Priority 2**: Search for related data if article lacks specifics
- Search: "[article topic] statistics [current year]"
- Search: "[company/product name] market data"
- Use authoritative sources: government data, company reports, research papers
- Always verify data accuracy

**Priority 3**: Only if no real data exists
- Clearly indicate estimates
- Use industry-standard ranges
- Base on logical assumptions from article context

### Data Point Guidelines

**Minimum data points by chart type**:
- Bar: 3-12 points
- Line: 6-20 points
- Area: 6-25 points
- Scatter: 10-50 points
- Pie: 2-6 slices

**Example - GOOD data (real, meaningful)**:
```json
{
  "chartType": "Line",
  "data": [
    {"x": 2018, "y": 23.4},
    {"x": 2019, "y": 28.1},
    {"x": 2020, "y": 31.7},
    {"x": 2021, "y": 38.2},
    {"x": 2022, "y": 45.6},
    {"x": 2023, "y": 52.3}
  ]
}
```
*Based on actual market growth data*

**Example - BAD data (too few points, meaningless)**:
```json
{
  "chartType": "Line",
  "data": [
    {"x": 1, "y": 10},
    {"x": 2, "y": 20},
    {"x": 3, "y": 30}
  ]
}
```
*Linear progression with no real-world basis*

## Chart Selection Decision Tree

Use this to choose the right chart type:

```
START: What are you trying to show?

├─ Trend over time?
│  ├─ Just the trend → LINE
│  └─ Emphasize total volume → AREA
│
├─ Comparison between categories?
│  ├─ Few categories (2-12) → BAR
│  └─ Parts of a whole → PIE (only if ≤6 categories)
│
├─ Relationship between variables?
│  └─ Correlation/distribution → SCATTER
│
└─ Distribution/frequency?
   └─ BAR (histogram style)
```

## Complete Examples

### Example 1: Market Growth (Area Chart)

**Article Context**: "AI market expected to reach $500B by 2024"

```json
{
  "chartType": "Area",
  "data": [
    {"x": 2019, "y": 93.5},
    {"x": 2020, "y": 136.6},
    {"x": 2021, "y": 191.4},
    {"x": 2022, "y": 298.2},
    {"x": 2023, "y": 387.4},
    {"x": 2024, "y": 500.0}
  ],
  "style": {
    "data": {
      "stroke": "#4CAF50",
      "fill": "#4CAF50",
      "strokeWidth": 3
    }
  },
  "options": {}
}
```

**Why this works**:
- Real market data (searchable)
- 6 data points showing clear trend
- Area chart emphasizes growth magnitude
- Green color indicates positive growth

### Example 2: Company Comparison (Bar Chart)

**Article Context**: "Top tech companies by market cap"

```json
{
  "chartType": "Bar",
  "data": [
    {"x": 1, "y": 2870},
    {"x": 2, "y": 2650},
    {"x": 3, "y": 2380},
    {"x": 4, "y": 1890},
    {"x": 5, "y": 1650},
    {"x": 6, "y": 1420}
  ],
  "style": {
    "data": {
      "fill": "#2196F3",
      "stroke": "#2196F3",
      "strokeWidth": 2
    }
  },
  "options": {}
}
```

**Why this works**:
- Based on real market cap data ($B)
- 6 companies compared
- Bar chart for easy comparison
- Blue (neutral) color

### Example 3: Stock Price Trend (Line Chart)

**Article Context**: "NVIDIA stock surges on AI boom"

```json
{
  "chartType": "Line",
  "data": [
    {"x": 1, "y": 146.50},
    {"x": 2, "y": 165.20},
    {"x": 3, "y": 189.75},
    {"x": 4, "y": 201.30},
    {"x": 5, "y": 245.80},
    {"x": 6, "y": 312.45},
    {"x": 7, "y": 378.90},
    {"x": 8, "y": 421.15},
    {"x": 9, "y": 467.30},
    {"x": 10, "y": 502.60}
  ],
  "style": {
    "data": {
      "stroke": "#4CAF50",
      "fill": "#4CAF50",
      "strokeWidth": 3
    }
  },
  "options": {}
}
```

**Why this works**:
- Real stock price data (verifiable)
- 10 data points for smooth trend line
- Line chart shows price movement
- Green indicates upward trend

### Example 4: Market Share (Pie Chart)

**Article Context**: "Cloud providers battle for market dominance"

```json
{
  "chartType": "Pie",
  "data": [
    {"x": 1, "y": 32, "label": "AWS"},
    {"x": 2, "y": 23, "label": "Azure"},
    {"x": 3, "y": 11, "label": "Google Cloud"},
    {"x": 4, "y": 34, "label": "Others"}
  ],
  "style": {
    "data": {
      "fill": "#2196F3",
      "stroke": "#2196F3",
      "strokeWidth": 2
    }
  },
  "options": {}
}
```

**Why this works**:
- Real market share percentages
- Only 4 slices (readable)
- Totals 100%
- Pie appropriate for market share

## Common Mistakes to Avoid

### ❌ DON'T:
1. Use string values for x/y: `{"x": "1", "y": "10"}` ❌
2. Create charts with 2 data points (except pie)
3. Use pie charts with >6 slices
4. Make up random numbers without real-world basis
5. Use dark colors on dark background (app has dark theme)
6. Create line charts for categorical data
7. Use scatter plots with <10 points

### ✅ DO:
1. Use numeric values: `{"x": 1, "y": 10}` ✅
2. Provide 6-20 data points for line/area charts
3. Use bar charts when in doubt
4. Search for real data before generating chart
5. Choose chart type based on data nature
6. Use vibrant colors that contrast with black background
7. Ensure data tells a clear story

## Testing Your Charts

Before sending chart configs to the frontend, verify:

- [ ] `chartType` is one of: Bar, Line, Area, Scatter, Pie (or Victory prefixed versions)
- [ ] All `x` values are numbers (not strings)
- [ ] All `y` values are numbers (not strings)
- [ ] Minimum data points met for chart type
- [ ] Data is factually accurate and sourced
- [ ] Colors are visible on dark background (#000)
- [ ] Chart type matches data nature (time = line, categories = bar, etc.)
- [ ] JSON is valid (no syntax errors)

## API Reference Summary

**Required Fields**:
```typescript
{
  chartType: 'Bar' | 'Line' | 'Area' | 'Pie' | 'Scatter',
  data: Array<{x: number; y: number; label?: string}>
}
```

**Optional Fields**:
```typescript
{
  style?: {
    data?: {
      fill?: string,      // Hex color code
      stroke?: string,    // Hex color code
      strokeWidth?: number  // 1-5 recommended
    }
  },
  options?: {} // Reserved for future use
}
```

## Questions?

If unclear which chart type to use:
1. Default to **Bar** for comparisons
2. Default to **Line** for time-based trends
3. When in doubt, prioritize clarity over complexity

**Remember**: A simple, accurate chart with real data is infinitely better than a complex chart with fake data.
