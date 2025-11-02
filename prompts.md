Image #1] here is the new design for content in the feed. looking specifically at articles first. we aren't
looking to replace article card, rather create a new generic "ContentCard" component. as you can see in the
design, the bottom row (likes row) is being carried across. the metadata about the content has been moved to
the top. tapping the 3 dots should give the option to see the author(s) or flag the content or leave feedback
(feedback board link). the text used is montserrat. it is swipeable, so should use the same framework that
BookCard used to enable the user to swipe to see the rest of the content. figmaDesign.png is the title page,
and then there'll be 5-8 slides after with the actual content on. for now, these can just have black
background design with montserrat text (centre aligned) in white. more guidance will be given regarding those
later slides in future. as you can see, there's an image on the title slide. consult the following guide
from my backend to know how to get the data from supabase. note that charts are mainly for papers, but it may be appropriate to include them in articles too (so be prepared to process victory native if required):

# Frontend Integration Guide - Story-Driven Slides

## Overview

This guide explains how your React Native (Expo) frontend should fetch and display the new story-driven slide content. The slides are stored in Supabase and rendered natively using Victory Native XL for charts.

---

## Database Schema

### Table: `content_slides`

```sql
CREATE TABLE content_slides (
  id UUID PRIMARY KEY,
  content_id INTEGER NOT NULL,           -- FK to articles.id or papers.id
  content_type TEXT NOT NULL,            -- 'article' or 'paper'
  slides_text TEXT[] NOT NULL,           -- Array of slide text content
  slides_titles TEXT[] NOT NULL,         -- Array of slide titles
  slides_images TEXT[],                  -- Array of image URLs (NULL for text-only)
  slides_chart_configs JSONB[],          -- Array of Victory chart configs
  total_slides INTEGER NOT NULL,         -- Total number of slides (6-8)
  generated_at TIMESTAMP DEFAULT NOW()
);
```

### Array Structure

All arrays have the **same length** (typically 6-8), indexed by slide number starting at 0:

- `slides_text[0]` = Slide 1 text content
- `slides_titles[0]` = Slide 1 title
- `slides_images[0]` = Slide 1 image URL or `null`
- `slides_chart_configs[0]` = Slide 1 Victory chart config or `null`

### Storage Bucket: `slide_visuals`

- **Purpose:** Stores AI-generated images for slides
- **Access:** Public
- **Path structure:** `{content_id}/slide_{slide_number}.png`
- **Example:** `123/slide_2.png` for article ID 123, slide 2

---

## Fetching Slide Data

### TypeScript Interface

```typescript
interface ContentSlides {
  id: string;
  content_id: number;
  content_type: "article" | "paper";
  slides_text: string[];
  slides_titles: string[];
  slides_images: (string | null)[];
  slides_chart_configs: (VictoryChartConfig | null)[];
  total_slides: number;
  generated_at: string;
}

interface VictoryChartConfig {
  chartType:
    | "VictoryBar"
    | "VictoryLine"
    | "VictoryArea"
    | "VictoryPie"
    | "VictoryScatter";
  data: Array<{ x: string | number; y: number }>;
  style?: {
    data?: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
    };
  };
  options?: {
    theme?: "dark" | "light";
    domainPadding?: number;
    [key: string]: any;
  };
}
```

### Supabase Query Examples

#### Get Slides for a Specific Article

```typescript
import { supabase } from "./supabaseClient";

async function getArticleSlides(
  articleId: number
): Promise<ContentSlides | null> {
  const { data, error } = await supabase
    .from("content_slides")
    .select("*")
    .eq("content_id", articleId)
    .eq("content_type", "article")
    .single();

  if (error) {
    console.error("Error fetching slides:", error);
    return null;
  }

  return data;
}
```

#### Get All Articles with Slides

```typescript
async function getArticlesWithSlides(limit: number = 20): Promise<any[]> {
  // First get articles that have slides
  const { data: slidesData, error: slidesError } = await supabase
    .from("content_slides")
    .select("content_id, content_type, total_slides, generated_at")
    .eq("content_type", "article")
    .order("generated_at", { ascending: false })
    .limit(limit);

  if (slidesError || !slidesData) {
    console.error("Error fetching slides:", slidesError);
    return [];
  }

  // Get the corresponding articles
  const articleIds = slidesData.map((s) => s.content_id);

  const { data: articlesData, error: articlesError } = await supabase
    .from("articles")
    .select("*")
    .in("id", articleIds);

  if (articlesError || !articlesData) {
    console.error("Error fetching articles:", articlesError);
    return [];
  }

  // Merge the data
  return articlesData.map((article) => ({
    ...article,
    hasSlides: true,
    slideCount:
      slidesData.find((s) => s.content_id === article.id)?.total_slides || 0,
  }));
}
```

#### Get Slides with Parent Content in One Query

```typescript
async function getArticleWithSlides(articleId: number) {
  // Get article data
  const { data: article, error: articleError } = await supabase
    .from("articles")
    .select("*")
    .eq("id", articleId)
    .single();

  // Get slides data
  const { data: slides, error: slidesError } = await supabase
    .from("content_slides")
    .select("*")
    .eq("content_id", articleId)
    .eq("content_type", "article")
    .single();

  if (articleError || slidesError) {
    console.error("Error fetching data:", articleError || slidesError);
    return null;
  }

  return {
    article,
    slides,
  };
}
```

---

## Rendering Slides in React Native

### Component Structure

```
<SlideViewer>
  ├── <SlideContainer>
  │   ├── <SlideTitle />
  │   ├── <SlideText />
  │   └── <SlideVisual />
  │       ├── (text-only) → null
  │       ├── (chart) → <VictoryChart />
  │       └── (image) → <Image />
```

### Installation Requirements

```bash
npm install victory-native react-native-svg react-native-skia
```

### Full Slide Viewer Component

```typescript
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
} from "react-native";
import {
  VictoryBar,
  VictoryLine,
  VictoryArea,
  VictoryPie,
  VictoryScatter,
  VictoryChart,
  VictoryTheme,
} from "victory-native";

interface SlideViewerProps {
  contentId: number;
  contentType: "article" | "paper";
}

const SlideViewer: React.FC<SlideViewerProps> = ({
  contentId,
  contentType,
}) => {
  const [slides, setSlides] = useState<ContentSlides | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetchSlides();
  }, [contentId]);

  const fetchSlides = async () => {
    const { data, error } = await supabase
      .from("content_slides")
      .select("*")
      .eq("content_id", contentId)
      .eq("content_type", contentType)
      .single();

    if (data) setSlides(data);
  };

  if (!slides) return <Text>Loading...</Text>;

  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={(e) => {
        const slideIndex = Math.round(
          e.nativeEvent.contentOffset.x / Dimensions.get("window").width
        );
        setCurrentSlide(slideIndex);
      }}
    >
      {Array.from({ length: slides.total_slides }).map((_, index) => (
        <Slide
          key={index}
          title={slides.slides_titles[index]}
          text={slides.slides_text[index]}
          imageUrl={slides.slides_images[index]}
          chartConfig={slides.slides_chart_configs[index]}
          slideNumber={index + 1}
          totalSlides={slides.total_slides}
        />
      ))}
    </ScrollView>
  );
};

interface SlideProps {
  title: string;
  text: string;
  imageUrl: string | null;
  chartConfig: VictoryChartConfig | null;
  slideNumber: number;
  totalSlides: number;
}

const Slide: React.FC<SlideProps> = ({
  title,
  text,
  imageUrl,
  chartConfig,
  slideNumber,
  totalSlides,
}) => {
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

  return (
    <View style={[styles.slide, { width: screenWidth, height: screenHeight }]}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {Array.from({ length: totalSlides }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i === slideNumber - 1 && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Visual Content */}
      <View style={styles.visualContainer}>
        {renderVisual(imageUrl, chartConfig)}
      </View>

      {/* Text Content */}
      <View style={styles.textContainer}>
        <Text style={styles.text}>{text}</Text>
      </View>

      {/* Slide Number */}
      <Text style={styles.slideNumber}>
        {slideNumber}/{totalSlides}
      </Text>
    </View>
  );
};

const renderVisual = (
  imageUrl: string | null,
  chartConfig: VictoryChartConfig | null
) => {
  // Priority: Chart > Image > Nothing (text-only)

  if (chartConfig) {
    return <VictoryChartRenderer config={chartConfig} />;
  }

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="contain"
      />
    );
  }

  return null; // Text-only slide
};

const VictoryChartRenderer: React.FC<{ config: VictoryChartConfig }> = ({
  config,
}) => {
  const chartTypeMap = {
    VictoryBar,
    VictoryLine,
    VictoryArea,
    VictoryPie,
    VictoryScatter,
  };

  const ChartComponent = chartTypeMap[config.chartType];

  if (!ChartComponent) {
    console.warn(`Unknown chart type: ${config.chartType}`);
    return null;
  }

  const isDark = config.options?.theme === "dark";

  return (
    <VictoryChart
      theme={isDark ? VictoryTheme.grayscale : VictoryTheme.material}
      domainPadding={config.options?.domainPadding || 20}
      {...config.options}
    >
      <ChartComponent data={config.data} style={config.style} />
    </VictoryChart>
  );
};

const styles = StyleSheet.create({
  slide: {
    backgroundColor: "#000",
    padding: 20,
    justifyContent: "space-between",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    marginTop: 40,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#444",
  },
  progressDotActive: {
    backgroundColor: "#fff",
    width: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
    marginBottom: 10,
  },
  visualContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  image: {
    width: "100%",
    height: 250,
  },
  textContainer: {
    marginBottom: 20,
  },
  text: {
    fontSize: 18,
    lineHeight: 28,
    color: "#fff",
  },
  slideNumber: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginBottom: 10,
  },
});

export default SlideViewer;
```

---

## Alternative: Swipeable Reels-Style Viewer

For a more Instagram Reels-like experience with vertical swiping:

```typescript
import { FlatList, Dimensions } from "react-native";

const ReelsViewer: React.FC<SlideViewerProps> = ({
  contentId,
  contentType,
}) => {
  const [slides, setSlides] = useState<ContentSlides | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const screenHeight = Dimensions.get("window").height;

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <Slide
      title={slides!.slides_titles[index]}
      text={slides!.slides_text[index]}
      imageUrl={slides!.slides_images[index]}
      chartConfig={slides!.slides_chart_configs[index]}
      slideNumber={index + 1}
      totalSlides={slides!.total_slides}
    />
  );

  return (
    <FlatList
      data={Array.from({ length: slides?.total_slides || 0 })}
      renderItem={renderItem}
      keyExtractor={(_, index) => index.toString()}
      pagingEnabled
      vertical
      showsVerticalScrollIndicator={false}
      snapToInterval={screenHeight}
      decelerationRate="fast"
      onViewableItemsChanged={({ viewableItems }) => {
        if (viewableItems[0]) {
          setCurrentIndex(viewableItems[0].index || 0);
        }
      }}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 50,
      }}
    />
  );
};
```

---

## Victory Chart Examples

### Example 1: Bar Chart (Growth Over Time)

```json
{
  "chartType": "VictoryBar",
  "data": [
    { "x": "2020", "y": 1000 },
    { "x": "2021", "y": 5000 },
    { "x": "2022", "y": 25000 },
    { "x": "2023", "y": 100000 }
  ],
  "style": {
    "data": {
      "fill": "#3b82f6"
    }
  },
  "options": {
    "theme": "dark",
    "domainPadding": 20
  }
}
```

### Example 2: Line Chart (Trend)

```json
{
  "chartType": "VictoryLine",
  "data": [
    { "x": 1, "y": 20 },
    { "x": 2, "y": 35 },
    { "x": 3, "y": 55 },
    { "x": 4, "y": 85 }
  ],
  "style": {
    "data": {
      "stroke": "#10b981",
      "strokeWidth": 3
    }
  },
  "options": {
    "theme": "dark"
  }
}
```

### Example 3: Area Chart (Comparison)

```json
{
  "chartType": "VictoryArea",
  "data": [
    { "x": "Q1", "y": 30 },
    { "x": "Q2", "y": 50 },
    { "x": "Q3", "y": 75 },
    { "x": "Q4", "y": 120 }
  ],
  "style": {
    "data": {
      "fill": "#8b5cf6",
      "fillOpacity": 0.7
    }
  },
  "options": {
    "theme": "dark"
  }
}
```

---

## Data Flow Summary

1. **Backend generates slides** → Stores in `content_slides` table
2. **Frontend fetches slides** → Query `content_slides` by `content_id` + `content_type`
3. **Iterate through arrays** → Map each index to a slide
4. **Render based on type**:
   - **Text-only** → Just title + text
   - **Chart** → Render Victory component from JSON config
   - **Image** → Display from Supabase storage URL

---

## Example Usage in App

### Article Feed Screen

```typescript
// Show articles that have slides
const ArticleFeed = () => {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    fetchArticlesWithSlides();
  }, []);

  const fetchArticlesWithSlides = async () => {
    const data = await getArticlesWithSlides(20);
    setArticles(data);
  };

  return (
    <FlatList
      data={articles}
      renderItem={({ item }) => (
        <ArticleCard
          article={item}
          onPress={() =>
            navigation.navigate("SlideViewer", {
              contentId: item.id,
              contentType: "article",
            })
          }
        />
      )}
    />
  );
};
```

### Slide Viewer Screen

```typescript
const SlideViewerScreen = ({ route }) => {
  const { contentId, contentType } = route.params;

  return <SlideViewer contentId={contentId} contentType={contentType} />;
};
```

---

## Performance Optimization

### Preload Next Slide Images

```typescript
useEffect(() => {
  // Preload next slide image
  if (currentSlide < slides.total_slides - 1) {
    const nextImageUrl = slides.slides_images[currentSlide + 1];
    if (nextImageUrl) {
      Image.prefetch(nextImageUrl);
    }
  }
}, [currentSlide]);
```

### Lazy Load Charts

```typescript
const LazyChart = ({ config, visible }) => {
  if (!visible) return null;
  return <VictoryChartRenderer config={config} />;
};
```

### Cache Slides Data

```typescript
import { useQuery } from "@tanstack/react-query";

const useSlides = (contentId: number, contentType: string) => {
  return useQuery({
    queryKey: ["slides", contentId, contentType],
    queryFn: () => getArticleSlides(contentId),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
```

---

## Error Handling

```typescript
const SlideViewer = ({ contentId, contentType }) => {
  const [slides, setSlides] = useState<ContentSlides | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlides();
  }, [contentId]);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from("content_slides")
        .select("*")
        .eq("content_id", contentId)
        .eq("content_type", contentType)
        .single();

      if (error) throw error;

      if (!data) {
        setError("No slides found for this content");
        return;
      }

      setSlides(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorView message={error} />;
  if (!slides) return <EmptyState message="No slides available" />;

  return <SlideContent slides={slides} />;
};
```

---

## Testing

### Sample Test Query

```sql
-- Get all slides with their article info
SELECT
  a.id,
  a.title,
  a.site_name,
  cs.total_slides,
  cs.slides_titles,
  array_length(cs.slides_text, 1) as text_count,
  array_length(cs.slides_images, 1) as image_count,
  array_length(cs.slides_chart_configs, 1) as chart_count
FROM articles a
JOIN content_slides cs ON cs.content_id = a.id AND cs.content_type = 'article'
ORDER BY cs.generated_at DESC
LIMIT 10;
```

### Verify Array Lengths Match

```sql
SELECT
  content_id,
  total_slides,
  array_length(slides_text, 1) = total_slides as text_match,
  array_length(slides_titles, 1) = total_slides as titles_match,
  array_length(slides_images, 1) = total_slides as images_match,
  array_length(slides_chart_configs, 1) = total_slides as charts_match
FROM content_slides
WHERE content_type = 'article';
```

---

## Summary

**Key Points:**

- ✅ Query `content_slides` table by `content_id` + `content_type`
- ✅ All arrays indexed from 0 to `total_slides - 1`
- ✅ Use Victory Native XL to render charts from JSON configs
- ✅ Images stored in `slide_visuals` bucket
- ✅ Swipe horizontally (or vertically) through slides
- ✅ Text-only slides have `null` for images and charts
- ✅ Dark theme optimized for mobile viewing

**Cost Benefits:**

- No image storage for charts (rendered natively)
- Fast loading (Victory uses Skia)
- Offline-capable (can cache configs)
