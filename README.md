# zeustraining

## Day 1 Task - Web Development Basics

## What is HTML?

HTML (HyperText Markup Language) is the standard markup language used to create the structure of web pages. It uses tags to define elements like headings, paragraphs, links, images, and more.

---

## Basic Structure of an HTML Page

```html
<!DOCTYPE html>
<html>
<head>
  <title>Page Title</title>
</head>
<body>

  <h1>This is a Heading</h1>
  <p>This is a paragraph.</p>

</body>
</html>
```

---

## Inline vs Block-Level Elements

**Inline Elements:**
- Do not start on a new line.
- Take only as much width as necessary.
- Examples: `<span>`, `<a>`, `<strong>`

**Block-Level Elements:**
- Always start on a new line.
- Take up the full width available.
- Examples: `<div>`, `<p>`, `<h1>`

---

## Ways to Apply CSS to HTML

1. **Inline CSS:**  
   Directly inside the HTML tag.
   ```html
   <p style="color: red;">This is red text.</p>
   ```

2. **Internal CSS:**  
   Inside a `<style>` tag in the `<head>`.
   ```html
   <style>
     p {
       color: blue;
     }
   </style>
   ```

3. **External CSS (Preferred):**  
   Linked through a separate `.css` file.
   ```html
   <link rel="stylesheet" href="style.css">
   ```

**Preferred Method:** External CSS is best for clean code separation, reusability, and easier maintenance.

---

## CSS Selectors

1. **Element Selector:**
   ```css
   p {
     color: green;
   }
   ```

2. **Class Selector:**
   ```css
   .highlight {
     background-color: yellow;
   }
   ```

3. **ID Selector:**
   ```css
   #main-title {
     font-size: 24px;
   }
   ```

---

## Ways to Add JavaScript to a Webpage

1. **Inline JavaScript:**
   ```html
   <button onclick="alert('Hello!')">Click Me</button>
   ```

2. **Internal JavaScript:**
   ```html
   <script>
     console.log("Hello from internal script");
   </script>
   ```

3. **External JavaScript (Preferred):**
   ```html
   <script src="script.js"></script>
   ```

**Preferred Method:** External JS allows better organization and reuse of code.

---

**End of Day 1 Task**
