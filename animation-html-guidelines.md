# HTML Animation Code Guidelines for Mobile WebView Display

## Critical Constraints

### 1. Canvas Dimensions
```javascript
function resize() {
  width = canvas.width = window.innerWidth;  // ✅ Full width is OK
  height = canvas.height = 300;              // ✅ MUST use fixed height ~300px
  // ❌ DO NOT use window.innerHeight (extends off-screen)
}
```

**Why:** The WebView container is only ~300-400px tall (about 40% of screen). Using `window.innerHeight` causes the canvas to render off-screen.

### 2. Complete HTML Structure
The generated HTML must be a **complete, self-contained document**:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        margin: 0;
        background: #050510;  /* Dark background recommended */
        overflow: hidden;
      }
      canvas { display: block; }
    </style>
  </head>
  <body>
    <canvas id="c"></canvas>
    <!-- External libraries allowed (GSAP, Three.js, etc.) -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script>
      // Your animation code here
    </script>
  </body>
</html>
```

### 3. Animation Best Practices

**✅ DO:**
- Use `requestAnimationFrame` for smooth animations
- Use GSAP timelines for narrative storytelling
- Keep canvas height at 300px
- Use dark backgrounds (#050510, #020205, etc.)
- Create looping animations with `gsap.timeline({repeat: -1})`
- Use state objects that GSAP can animate:
  ```javascript
  const state = { x: 0, rotation: 0, size: 50 };
  gsap.to(state, { x: 100, duration: 2 });
  // Then read state.x in your animation loop
  ```

**❌ DON'T:**
- Use `window.innerHeight` for canvas height
- Create interactive elements (buttons, inputs)
- Use very large file sizes (keep animations under 10KB code)
- Assume touch events work (it's display-only)
- Use `alert()`, `confirm()`, or `prompt()`

### 4. Visual Quality Guidelines

**Aspect Ratio:** Approximately 16:5 (wide and short)
- Width: Full mobile width (~375-430px)
- Height: 300px fixed

**Color Palette:**
- Background: Dark (#050510, #020205, #0a0a0f)
- Primary elements: Bright contrasts (#00f2ff, #ff0044, #ffcc00)
- Text: White/light for readability
- Transparency: Use alpha values for glows (e.g., "#00f2ff33")

### 5. Performance Optimization

```javascript
// ✅ Clear canvas efficiently
ctx.fillStyle = backgroundColor;
ctx.fillRect(0, 0, width, height);

// ✅ Limit particle counts
const MAX_PARTICLES = 50;

// ✅ Use state-driven rendering
function animate() {
  // Clear
  ctx.fillRect(0, 0, width, height);

  // Draw based on state (updated by GSAP)
  drawElements(state);

  requestAnimationFrame(animate);
}
```

### 6. Content Security Policy (CSP)
External CDN scripts are **allowed**:
- GSAP: `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js`
- Three.js: `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`
- Other common animation libraries

### 7. Example Template

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { margin: 0; background: #050510; overflow: hidden; }
      canvas { display: block; }
    </style>
  </head>
  <body>
    <canvas id="c"></canvas>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script>
      const canvas = document.getElementById("c");
      const ctx = canvas.getContext("2d");
      let width, height;

      function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = 300; // FIXED HEIGHT
      }
      resize();

      const state = { /* animation state */ };

      function animate() {
        ctx.fillStyle = "#050510";
        ctx.fillRect(0, 0, width, height);

        // Draw your animation using state

        requestAnimationFrame(animate);
      }

      // GSAP timeline for story
      gsap.timeline({repeat: -1})
        .to(state, { /* animate properties */ });

      animate();
    </script>
  </body>
</html>
```

## Testing Checklist

Before deploying animation code to production:

- [ ] Canvas height is 300px (not window.innerHeight)
- [ ] Animation loops properly
- [ ] Visible on dark background
- [ ] No console errors
- [ ] Complete HTML document (<!DOCTYPE html> through </html>)
- [ ] External scripts use HTTPS CDN URLs
- [ ] File size reasonable (<10KB)
- [ ] Works on ~16:5 aspect ratio

## Common Issues

| Problem | Solution |
|---------|----------|
| Canvas not visible | Check if height is 300px, not window.innerHeight |
| Animation off-screen | Canvas extends below visible area - reduce height |
| Black screen | Background color might match StaticVisual |
| Choppy animation | Use requestAnimationFrame, limit particle counts |
| Script not loading | Check CDN URL uses HTTPS |
