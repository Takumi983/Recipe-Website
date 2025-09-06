// Middleware for Data Validation

function send400(res, msg, detail) {
  return res
    .status(400)
    .send(
      `<h3>400 Bad Request</h3><p>${msg}</p>${
        detail ? `<pre>${detail}</pre>` : ""
      }`
    );
}

/* --- Recipe --- */
function validateRecipeBody(req, res, next) {
  const {
    title,
    chef,
    mealType,
    cuisineType,
    prepTime,
    difficulty,
    servings,
    ingredients,
    instructions
  } = req.body;

  const pos = (v) => Number.isFinite(Number(v)) && Number(v) > 0;

  if (!title?.trim()) return send400(res, "Title is required");
  if (!chef?.trim()) return send400(res, "Chef is required");
  if (!mealType?.trim()) return send400(res, "Meal type is required");
  if (!cuisineType?.trim()) return send400(res, "Cuisine type is required");
  if (!pos(prepTime)) return send400(res, "prepTime must be a positive number");
  if (!["Easy", "Medium", "Hard"].includes(String(difficulty)))
    return send400(res, "difficulty must be Easy/Medium/Hard");
  if (!pos(servings)) return send400(res, "servings must be a positive number");
  if (!String(ingredients ?? "").trim())
    return send400(res, "ingredients is required");
  if (!String(instructions ?? "").trim())
    return send400(res, "instructions is required");

  next();
}

/* --- Inventory --- */
function validateInventoryBody(req, res, next) {
  const {
    ingredientName,
    category,
    unit,
    quantity,
    cost,
    expirationDate,
    location
  } = req.body;
  const numNZ = (v) => !isNaN(v) && Number(v) >= 0;

  if (!ingredientName?.trim())
    return send400(res, "ingredientName is required");
  if (!category?.trim()) return send400(res, "category is required");
  if (!unit?.trim()) return send400(res, "unit is required");
  if (!location?.trim()) return send400(res, "location is required");
  if (!numNZ(quantity)) return send400(res, "quantity must be >= 0");
  if (!numNZ(cost)) return send400(res, "cost must be >= 0");

  if (expirationDate) {
    // Accept only valid YYYY-MM-DD
    const ymd = /^\d{4}-\d{2}-\d{2}$/;
    if (!ymd.test(String(expirationDate))) {
      return send400(res, "expirationDate must be YYYY-MM-DD");
    }
  }
  next();
}

module.exports = {
  validateRecipeBody,
  validateInventoryBody
};
