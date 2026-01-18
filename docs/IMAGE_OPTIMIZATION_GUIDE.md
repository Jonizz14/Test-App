# Image Optimization Guide

## Current Issue
Lighthouse detects ~3.8MB of images that can be optimized:
- `/banner/inf1.png` - 1.24MB
- `/banner/inf2.png` - 1.59MB  
- `/banner/inf3.png` - 1.20MB

## Recommended Actions

### 1. Convert to WebP Format
WebP provides superior compression (30-50% smaller) while maintaining quality.

**Tools:**
- Online: [Squoosh.app](https://squoosh.app/)
- CLI: `npm install -g sharp-cli`

**CLI Commands:**
```bash
cd public/banner

# Convert PNGs to WebP
sharp -i inf1.png -o inf1.webp -f webp -q 85
sharp -i inf2.png -o inf2.webp -f webp -q 85
sharp -i inf3.png -o inf3.webp -f webp -q 85
```

### 2. Update Image References in Code

**In `Home.jsx`**, update image sources to use WebP with PNG fallback:

```jsx
<picture>
  <source srcSet="/banner/inf1.webp" type="image/webp" />
  <img 
    src="/banner/inf1.png" 
    alt="Analysis" 
    className="feature-img"
    width="750" 
    height="500" 
    loading="lazy"
  />
</picture>
```

### 3. Add Responsive Images (Optional)

Create multiple sizes for different viewports:
```bash
# Desktop (1536px)
sharp -i inf1.png -o inf1-1536w.webp -f webp -q 85 --resize 1536

# Tablet (1024px)  
sharp -i inf1.png -o inf1-1024w.webp -f webp -q 85 --resize 1024

# Mobile (768px)
sharp -i inf1.png -o inf1-768w.webp -f webp -q 85 --resize 768
```

Then use `srcset`:
```jsx
<img 
  srcSet="
    /banner/inf1-768w.webp 768w,
    /banner/inf1-1024w.webp 1024w,
    /banner/inf1-1536w.webp 1536w
  "
  sizes="(max-width: 768px) 768px, (max-width: 1024px) 1024px, 1536px"
  src="/banner/inf1.webp"
  alt="Analysis"
/>
```

### 4. Expected Results

After optimization:
- **File Size**: 3.8MB → ~1.2MB (70% reduction)
- **LCP**: 4.7s → ~3.0s (improvement)
- **Performance Score**: 60 → 75+ (projected)

## Automation

Add image optimization to your build process in `package.json`:
```json
{
  "scripts": {
    "optimize-images": "sharp -i 'public/banner/*.png' -o 'public/banner/{name}.webp' -f webp -q 85"
  }
}
```
