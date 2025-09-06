class Recipe {
  constructor({
    recipeId,
    title,
    chef,
    ingredients = [],
    instructions = [],
    mealType,
    cuisineType,
    prepTime,
    difficulty,
    servings,
    createdDate = new Date().toISOString().slice(0, 10)
  }) {
    /* --- Data validation --- */
    // recipeId must follow "R-00001" format
    if (!/^R-\d{5}$/.test(String(recipeId))) {
      throw new Error("recipeId must be in 'R-00001' format");
    }
    // Required string fields
    if (!String(title || "").trim()) throw new Error("title is required");
    if (!String(chef || "").trim()) throw new Error("chef is required");

    // Numeric fields
    const n = (x) => Number(x);
    if (!Number.isFinite(n(prepTime)) || n(prepTime) <= 0) {
      throw new Error("prepTime must be a number > 0");
    }
    if (!["Easy", "Medium", "Hard"].includes(String(difficulty))) {
      throw new Error("difficulty must be one of 'Easy' | 'Medium' | 'Hard'");
    }
    if (!Number.isFinite(n(servings)) || n(servings) <= 0) {
      throw new Error("servings must be a number > 0");
    }

    // Arrays
    if (!Array.isArray(ingredients)) {
      throw new Error("ingredients must be an array");
    }
    if (!Array.isArray(instructions)) {
      throw new Error("instructions must be an array");
    }

    // Date (YYYY-MM-DD)
    const isYmd = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s));
    if (!isYmd(createdDate)) {
      throw new Error("createdDate must be in 'YYYY-MM-DD' format");
    }

    /* --- Assign --- */
    this.recipeId = String(recipeId);
    this.title = String(title).trim();
    this.chef = String(chef).trim();
    this.ingredients = ingredients.slice();
    this.instructions = instructions.slice();
    this.mealType = String(mealType || "").trim();
    this.cuisineType = String(cuisineType || "").trim();
    this.prepTime = n(prepTime);
    this.difficulty = String(difficulty);
    this.servings = n(servings);
    this.createdDate = String(createdDate);
  }

  /* --- Helpers methods --- */
  static formatId(n) {
    return `R-${String(n).padStart(5, "0")}`;
  }

  static parseList(str) {
    return String(str || "")
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /* --- Methods --- */
  /** Return the list of recipes */
  static list(recipes) {
    return Array.isArray(recipes) ? recipes : [];
  }

  /** Find one recipe by recipeId (returns null if not found) */
  static findById(recipes, recipeId) {
    if (!Array.isArray(recipes)) return null;
    const rid = String(recipeId || "");
    return recipes.find((r) => r.recipeId === rid) || null;
  }

  /** Add a new recipe (payload from req.body, normalize to external format) */
  static add(recipes, payload) {
    if (!Array.isArray(recipes)) throw new Error("recipes must be an array");

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
    } = payload || {};

    const t = String(title || "").trim();
    const chefValue = String(chef || "").trim();
    if (!t) throw new Error("title is required");
    if (!chefValue) throw new Error("chef is required");

    // Generate next recipeId
    const nextNum =
      recipes
        .map((r) => {
          const m = String(r.recipeId || "").match(/^R-(\d{5})$/);
          return m ? Number(m[1]) : 0;
        })
        .reduce((a, b) => Math.max(a, b), 0) + 1;

    const newRecipe = {
      recipeId: Recipe.formatId(nextNum),
      title: t,
      chef: chefValue,
      mealType: String(mealType || "").trim(),
      cuisineType: String(cuisineType || "").trim(),
      prepTime: Number(prepTime),
      difficulty: String(difficulty || "").trim(),
      servings: Number(servings),
      createdDate: new Date().toISOString().slice(0, 10),
      ingredients: Recipe.parseList(ingredients),
      instructions: Recipe.parseList(instructions)
    };

    const validated = new Recipe(newRecipe);
    recipes.push(validated);
    return validated;
  }

  /** Delete by recipeId (returns removed object or null if not found) */
  static deleteById(recipes, recipeId) {
    if (!Array.isArray(recipes)) return null;
    const rid = String(recipeId || "");
    const idx = recipes.findIndex((r) => r.recipeId === rid);
    if (idx === -1) return null;
    const [removed] = recipes.splice(idx, 1);
    return removed || null;
  }
}

module.exports = Recipe;
