/* --- Define server --- */
const path = require("path"); // Node.js module for handling and transforming file paths
const express = require("express");
const Recipe = require("./models/recipe");
const InventoryItem = require("./models/inventoryItem");
const PORT = 3001;

const app = express();
const { recipes, inventory } = require("./data/sampleData"); // Load sample data for recipes and inventory

/* --- Set View Engine --- */
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
app.set("views", path.join(__dirname, "views"));

/* --- Provide Static files --- */
app.use(
  "/bootstrap",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist")) // Serve Bootstrap files from node_modules
);
app.use(express.static(path.join(__dirname, "public"))); // Serve static files (CSS, JS, images) from /public folder

/* --- Middleware --- */
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies (e.g., form submissions)

// Validation middleware
const {
  validateRecipeBody,
  validateInventoryBody
} = require("./middleware/validators");

/* --- Routes --- */
// Home (index.html)
app.get("/", (_req, res) => {
  // To show the detail of Recipe Hub
  const metrics = {
    totalRecipes: recipes.length,
    totalInventoryItems: inventory.length,
    cuisineTypeCount: new Set(recipes.map((r) => r.cuisineType)).size,
    inventoryValue: inventory.reduce(
      (sum, i) => sum + Number(i.quantity) * Number(i.cost || 0),
      0
    )
  };

  res.render("index", {
    // Pass the student and metrics to index.html
    student: { name: "Takumi Watanabe", id: "00000001" },
    metrics
  });
});

// Adds Recipe (add-recipe.html)
app.get("/add-recipe-00000001", (_req, res) =>
  res.render("recipe/add-recipe", {
    student: { name: "Takumi Watanabe", id: "00000001" }
  })
);

app.post("/recipe-1", validateRecipeBody, (req, res) => {
  try {
    Recipe.add(recipes, req.body);
    res.redirect(303, "/recipe-00000001");
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// View Recipe List
app.get("/recipe-00000001", (_req, res) => {
  const uiRecipes = Recipe.list(recipes);

  res.render("recipe/view-recipe", {
    // Pass the uiRecipes and student to index.html
    recipes: uiRecipes,
    student: { name: "Takumi Watanabe", id: "00000001" }
  });
});

// Recipe Deletion Functionality
// Delete confirmation page
app.get("/delete-recipe-00000001", (req, res) => {
  const selectedRecipeId = String(req.query.id || "");
  const selected = Recipe.findById(recipes, selectedRecipeId);

  // Build a UI-friendly list of recipes
  const uiRecipes = Recipe.list(recipes);

  // Render confirmation page, passing data into delete-recipe.html
  res.render("recipe/delete-recipe", {
    recipes: uiRecipes,
    selected,
    selectedId: selectedRecipeId,
    student: { name: "Takumi Watanabe", id: "00000001" },
    fmtId: (rid) => rid,
    msg: req.query.msg || null,
    msgType: req.query.type || "info"
  });
});

// Delete confirmation submit
app.post("/delete-recipe-00000001", (req, res) => {
  // Extract the recipeId from the form body
  const rid = String(req.body.recipeId || "");
  // Check if the confirmation checkbox was ticked
  const confirmed = req.body.confirm === "on";

  // If confirmation checkbox is not ticked, redirect back with a warning message
  if (!confirmed) {
    return res.redirect(
      `/delete-recipe-00000001?id=${encodeURIComponent(
        rid
      )}&type=warning&msg=${encodeURIComponent(
        "Please tick the confirmation checkbox to proceed."
      )}`
    );
  }

  // Attempt to delete the recipe by ID
  const removed = Recipe.deleteById(recipes, rid);
  // If the ID is invalid or not found, redirect back with an error message
  if (!removed) {
    return res.redirect(
      `/delete-recipe-00000001?type=danger&msg=${encodeURIComponent(
        "Invalid recipe ID selected."
      )}`
    );
  }

  // If deletion is successful, redirect to the recipe list with status 303
  return res.redirect(303, "/recipe-00000001");
});

// Direct delete by route parameter
app.post("/recipe/:recipeId/delete-00000001", (req, res) => {
  Recipe.deleteById(recipes, String(req.params.recipeId));
  res.redirect(303, "/recipe-00000001");
});

// Adds Inventory Items
// Route to just show the screen to users
app.get("/inventoryItem/add-00000001", (_req, res) =>
  res.render("inventory/add-inventoryItem", {
    student: { name: "Takumi Watanabe", id: "00000001" }
  })
);

// Route to handle submission of the "Add Inventory Item" form
app.post("/inventory-00000001", validateInventoryBody, (req, res) => {
  try {
    // Ensure userId is included in the request body (add it if missing)
    if (!req.body.userId) {
      req.body.userId = "TakumiWatanabe-00000001";
    }

    // Add the new inventory item to the in-memory inventory list
    InventoryItem.add(inventory, req.body);
    // Redirect the user to the inventory list page after successful submission
    res.redirect(303, "/inventoryItem-00000001");
  } catch (err) {
    // If validation or adding fails, return a 400 Bad Request with error message
    res.status(400).send(err.message);
  }
});

// Inventory Display Dashboard
app.get("/inventoryItem-00000001", (req, res) => {
  // Derived values ​​such as deadlines and amounts are assigned here（daysLeft, lineValue(quantity * cost) etc.）
  const items = InventoryItem.withDerived(inventory);

  // Calculate the total inventory value
  const totalValue = items.reduce(
    (s, i) => s + Number(i.lineValue ?? (i.quantity || 0) * (i.cost || 0)),
    0
  );

  // Collect unique categories
  const categories = [
    ...new Set(items.map((i) => i.category || "Uncategorized"))
  ];
  // Collect unique storage locations
  const locations = [...new Set(items.map((i) => i.location || "Unknown"))];

  // Render the inventory dashboard view with all computed values
  res.render("inventory/view-inventoryItem", {
    items,
    totalValue,
    categories,
    locations,
    student: { name: "Takumi Watanabe", id: "00000001" },
    msg: req.query.msg || null,
    msgType: req.query.type || "info"
  });
});

// Inventory Item Removal
// To show the users Inventory deletion page (confirmation)
app.get("/delete-inventoryItem-00000001", (req, res) => {
  // Selected ID from query string (when user chooses an item in the dropdown)
  const selectedInventoryId = String(req.query.id || "");
  // Preload the selected item for preview (null if not found)
  const selected = InventoryItem.findById(inventory, selectedInventoryId);

  const items = InventoryItem.list(inventory);

  // Render the confirmation view with optional flash message
  res.render("inventory/delete-inventoryItem", {
    inventory: items,
    selected,
    selectedId: selectedInventoryId,
    student: { name: "Takumi Watanabe", id: "00000001" },
    msg: req.query.msg || null,
    msgType: req.query.type || "info"
  });
});

// POST: Handle the confirmation form and forward to the resourceful delete route
app.post("/delete-inventoryItem-00000001", (req, res) => {
  return res.redirect(
    307,
    `/inventory/${encodeURIComponent(req.body.itemId)}/delete-00000001`
  );
});

// POST: Resourceful delete by inventoryId (string)
// Performs the actual deletion and redirects back to the dashboard
app.post("/inventory/:inventoryId/delete-00000001", (req, res) => {
  // Attempt to remove by ID; returns the removed record or falsy if not found
  const removed = InventoryItem.deleteById(inventory, req.params.inventoryId);
  // Not found → redirect with an error flash
  if (!removed) {
    return res.redirect(
      `/inventoryItem-00000001?type=danger&msg=${encodeURIComponent(
        "Inventory ID not found."
      )}`
    );
  }
  // Success → redirect with a success flash
  // 303 changes POST to a GET for the following request (perfect for “back to list”)
  res.redirect(
    303,
    `/inventoryItem-00000001?type=success&msg=${encodeURIComponent(
      `Deleted: ${removed.ingredientName} (ID: ${removed.inventoryId})`
    )}`
  );
});

/*==================================Advanced Features================================*/
// Advanced Recipe Filtering
app.get("/filter-recipe-00000001", (req, res) => {
  // Extract query parameters with default value "all"
  const {
    mealType = "all",
    cuisineType = "all",
    difficulty = "all"
  } = req.query;

  // Collect all unique meal types from the recipe list (sorted, no empty values)
  const mealTypes = [...new Set(recipes.map((r) => r.mealType))]
    .filter(Boolean)
    .sort();
  // Collect all unique cuisine types from the recipe list (sorted, no empty values)
  const cuisineTypes = [...new Set(recipes.map((r) => r.cuisineType))]
    .filter(Boolean)
    .sort();
  // Define the allowed difficulty levels
  const difficulties = ["Easy", "Medium", "Hard"];

  // Helper: returns true if value matches the selected filter or if filter = "all"
  const eqOrAll = (val, sel) =>
    sel === "all" ||
    String(val || "").toLowerCase() === String(sel).toLowerCase();

  // Filter recipes based on the selected mealType, cuisineType, and difficulty
  const filtered = recipes.filter(
    (r) =>
      eqOrAll(r.mealType, mealType) &&
      eqOrAll(r.cuisineType, cuisineType) &&
      eqOrAll(r.difficulty, difficulty)
  );

  // Render the filter view, passing filtered recipes and metadata
  res.render("Advanced/filter-recipe", {
    recipes: filtered,
    meta: { total: recipes.length, shown: filtered.length },
    options: { mealTypes, cuisineTypes, difficulties },
    selected: { mealType, cuisineType, difficulty },
    student: { name: "Takumi Watanabe", id: "00000001" }
  });
});

// Search & Scale
// Helper: case-insensitive substring check
function textIncludes(haystack, needle) {
  return String(haystack || "")
    .toLowerCase()
    .includes(String(needle || "").toLowerCase());
}

// Helper: scale a single ingredient line if it starts with a number
// Example: "200 g flour" with scale 0.5 → "100 g flour"
function scaleLine(line, scale) {
  const m = String(line).match(/^\s*([0-9]+(?:\.[0-9]+)?)\s*(.*)$/);
  if (!m) return line; // No leading number → return as-is
  const qty = parseFloat(m[1]);
  if (!Number.isFinite(qty)) return line; // Not a valid number → return as-is
  const rest = m[2];
  const scaled = +(qty * scale).toFixed(2); // Round to 2 decimals
  return `${scaled} ${rest}`.trim();
}

app.get("/search-recipe-00000001", (req, res) => {
  // Determine if a search has been triggered
  // (only show results when "query" or "scale" is provided)
  const hasSearched =
    typeof req.query.query !== "undefined" ||
    typeof req.query.scale !== "undefined";

  // Extract query string and trim whitespace
  const query = (req.query.query || "").trim();

  // Sanitize scale (fallback to 1; clamp to 0.25–5)
  const rawScale = parseFloat(req.query.scale);
  const scale = Number.isFinite(rawScale)
    ? Math.min(5, Math.max(0.25, rawScale))
    : 1;

  let results = [];
  if (hasSearched) {
    // Only filter & render results when the user has triggered a search
    const filtered = recipes.filter((r) => {
      if (!query) return true; // If query is empty but user pressed Search → show all
      return (
        textIncludes(r.title, query) ||
        textIncludes(r.chef, query) ||
        textIncludes(r.mealType, query) ||
        textIncludes(r.cuisineType, query) ||
        (r.ingredients || []).some((x) => textIncludes(x, query)) ||
        (r.instructions || []).some((x) => textIncludes(x, query))
      );
    });

    // Compute scaled values for display
    results = filtered.map((r) => ({
      ...r,
      servingsScaled: Math.max(1, Math.round((r.servings || 1) * scale)),
      ingredientsScaled: (r.ingredients || []).map((line) =>
        scaleLine(line, scale)
      ),
      scale
    }));
  }

  // Render search-recipe.html with search context
  res.render("Advanced/search-recipe", {
    results,
    count: results.length,
    query,
    scale,
    hasSearched,
    student: { name: "Takumi Watanabe", id: "00000001" }
  });
});

/* --- 404 page --- */
app.use((_req, res) => {
  res.status(404).render("404", {
    student: { name: "Takumi Watanabe", id: "00000001" }
  });
});

/* --- Server starts --- */
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
