class InventoryItem {
  constructor({
    inventoryId,
    userId,
    ingredientName,
    quantity,
    unit,
    category,
    purchaseDate,
    expirationDate,
    location,
    cost = 0,
    createdDate = new Date().toISOString().slice(0, 10)
  }) {
    /* --- Data validation (external format only) --- */
    // inventoryId must follow "I-00001" format
    if (!/^I-\d{5}$/.test(String(inventoryId))) {
      throw new Error("inventoryId must be in 'I-00001' format");
    }
    // Required strings
    if (!String(userId || "").trim()) throw new Error("userId is required");
    if (!String(ingredientName || "").trim())
      throw new Error("ingredientName is required");
    if (!String(unit || "").trim()) throw new Error("unit is required");
    if (!String(category || "").trim()) throw new Error("category is required");
    if (!String(location || "").trim()) throw new Error("location is required");

    // Numeric fields
    const n = (x) => Number(x);
    if (!Number.isFinite(n(quantity)) || n(quantity) < 0) {
      throw new Error("quantity must be a non-negative number");
    }
    if (!Number.isFinite(n(cost)) || n(cost) < 0) {
      throw new Error("cost must be a number >= 0");
    }

    // Dates (YYYY-MM-DD)
    const isYmd = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s));
    if (purchaseDate && !isYmd(purchaseDate)) {
      throw new Error("purchaseDate must be in 'YYYY-MM-DD' format");
    }
    if (expirationDate && !isYmd(expirationDate)) {
      throw new Error("expirationDate must be in 'YYYY-MM-DD' format");
    }
    if (!isYmd(createdDate)) {
      throw new Error("createdDate must be in 'YYYY-MM-DD' format");
    }
    // Expiration should not be earlier than purchase
    if (purchaseDate && expirationDate && purchaseDate > expirationDate) {
      throw new Error("expirationDate must not be earlier than purchaseDate");
    }

    /* --- Assign --- */
    this.inventoryId = String(inventoryId);
    this.userId = String(userId).trim();
    this.ingredientName = String(ingredientName).trim();
    this.quantity = n(quantity);
    this.unit = String(unit).trim();
    this.category = String(category).trim();
    this.purchaseDate = purchaseDate || "";
    this.expirationDate = expirationDate || "";
    this.location = String(location).trim();
    this.cost = n(cost);
    this.createdDate = String(createdDate);
  }

  /* --- Helpers --- */
  static formatId(n) {
    return `I-${String(n).padStart(5, "0")}`;
  }

  /* --- Methods --- */

  /** Return list as-is */
  static list(items) {
    return Array.isArray(items) ? items : [];
  }

  /** Find one by inventoryId (returns null if not found) */
  static findById(items, inventoryId) {
    if (!Array.isArray(items)) return null;
    const iid = String(inventoryId || "");
    return items.find((i) => i.inventoryId === iid) || null;
  }

  /**
   * Add a new item (payload from req.body) in external format.
   * Maps common form field names to the external schema:
   *   name -> ingredientName
   *   pricePerUnit -> cost
   *   expiry -> expirationDate
   *   (userId is expected in the payload or you can set a default in your route)
   */
  static add(items, payload) {
    if (!Array.isArray(items)) throw new Error("items must be an array");

    const {
      // incoming form fields
      userId,
      name, // -> ingredientName
      ingredientName, // allow either
      category,
      location,
      quantity,
      unit,
      pricePerUnit, // -> cost
      cost, // allow either
      expiry, // -> expirationDate
      expirationDate, // allow either
      purchaseDate,
      createdDate // optional override
    } = payload || {};

    const ingName = String(ingredientName || name || "").trim();
    if (!ingName) throw new Error("ingredientName (or name) is required");

    const uid = String(userId || "").trim();
    if (!uid) throw new Error("userId is required");

    // Generate next inventoryId by scanning existing list
    const nextNum =
      items
        .map((i) => {
          const m = String(i.inventoryId || "").match(/^I-(\d{5})$/);
          return m ? Number(m[1]) : 0;
        })
        .reduce((a, b) => Math.max(a, b), 0) + 1;

    const newItemRaw = {
      inventoryId: InventoryItem.formatId(nextNum),
      userId: uid,
      ingredientName: ingName,
      quantity: Number(quantity),
      unit: String(unit || "").trim(),
      category: String(category || "").trim(),
      purchaseDate: purchaseDate || new Date().toISOString().slice(0, 10),
      expirationDate: (expirationDate || expiry || "").toString(),
      location: String(location || "Unknown").trim(),
      cost: Number(cost ?? pricePerUnit ?? 0),
      createdDate: (
        createdDate || new Date().toISOString().slice(0, 10)
      ).toString()
    };

    // Validate via constructor for safety
    const validated = new InventoryItem(newItemRaw);
    items.push(validated);
    return validated;
  }

  /** Delete by inventoryId (returns removed object or null if not found) */
  static deleteById(items, inventoryId) {
    if (!Array.isArray(items)) return null;
    const iid = String(inventoryId || "");
    const idx = items.findIndex((i) => i.inventoryId === iid);
    if (idx === -1) return null;
    const [removed] = items.splice(idx, 1);
    return removed || null;
  }

  /**
   * Enrich items for dashboard:
   * - daysLeft: days until expirationDate (ceil)
   * - lineValue: quantity * cost
   */
  static withDerived(items, today = new Date()) {
    const startOfDay = (d) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x;
    };
    const base = startOfDay(today);

    return (items || []).map((i) => {
      let daysLeft = null;
      if (i.expirationDate) {
        const d = new Date(i.expirationDate);
        daysLeft = Math.ceil((d - base) / (1000 * 60 * 60 * 24));
      }
      const lineValue = Number(i.quantity) * Number(i.cost || 0);
      return { ...i, daysLeft, lineValue };
    });
  }
}

module.exports = InventoryItem;
