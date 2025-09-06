# Recipe Hub

A web application built with **Node.js**, **Express**, and **EJS**.  
The app demonstrates full-stack development with:

- **Recipe management (CRUD)**: add, edit, delete, and view recipes
- **Inventory tracking**: maintain a personal ingredient list with quantities, costs, and expiry dates
- **Validation middleware**: server-side validation for robust data entry
- **Bootstrap-based UI**: clean and responsive front-end layout

---

### Features

#### Recipes

- **Dashboard** (`/`)  
  Overview of total recipes, inventory items, cuisine types, and overall inventory value.
- **Add Recipe** (`/add-recipe`)  
  Form to create new recipes with validation for title, chef, meal type, cuisine type, prep time, difficulty, servings, ingredients, and instructions.
- **List Recipes** (`/recipe`)  
  Displays all saved recipes with metadata.
- **Delete Recipe** (`/delete-recipe`)  
  Two-step deletion process with confirmation screen and success/failure feedback.
- **Advanced Filtering** (`/filter-recipe`)  
  Filter recipes dynamically by meal type, cuisine type, or difficulty level.
- **Search & Scaling** (`/search-recipe`)  
  Search recipes by keyword across title, chef, ingredients, and instructions, with ingredient scaling for servings.

#### Inventory

- **Add Inventory Item** (`/inventoryItem/add`)  
  Create inventory entries with details such as name, category, location, quantity, unit, cost, expiration date, and supplier. Includes validation middleware.
- **List Inventory** (`/inventoryItem`)  
  View all items with expiry countdown, total cost, and summary statistics.
- **Delete Inventory Item** (`/delete-inventoryItem`)  
  Confirmation and deletion of items with clear error/success messages.

#### Error Handling

- **Validation Middleware**: Ensures proper input formats and values, returning clear error messages on failure.
- **Catch-All 404** (`*`): Any undefined route returns a styled 404 error page.

---

### Purpose

This project was created to **practice full-stack web development** using Express and templating engines,  
with a focus on clean architecture, middleware usage, and separation of concerns.

---

### Tech Stack

- Node.js
- Express
- EJS
- Bootstrap

---

### Getting Started

```bash
npm install
node app.js
```
