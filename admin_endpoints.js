// ===========================================
// 🔐 ADMIN ENDPOINTS - GESTION DES FORMULES
// ===========================================

// GET Admin - Récupérer tous les plans tarifaires
app.get("/api/admin/pricing-plans", async (req, res) => {
  try {
    const plans = [
      {
        id: 1, code: "DISCOVERY", name: "Découverte",
        price_monthly: 0, max_students: 1, is_popular: false, is_active: true,
        features: ["Accès à 3 matières", "Exercices de base", "Suivi basique", "Support email"]
      },
      {
        id: 2, code: "INDIVIDUAL", name: "Individuelle",
        price_monthly: 8000, max_students: 1, is_popular: false, is_active: true,
        features: ["Accès illimité", "1 élève", "IA personnalisée", "Prix Claudine", "Support email"]
      },
      {
        id: 3, code: "FAMILY", name: "Familiale",
        price_monthly: 15000, original_price_monthly: 24000, max_students: 3, is_popular: true, is_active: true,
        features: ["Accès illimité", "Jusqu'à 3 enfants", "IA + Dashboard parents", "Prix Claudine", "Support prioritaire"]
      }
    ];

    const stats = { totalPlans: 3, activePlans: 3, popularPlan: "Familiale" };
    res.json({ success: true, data: { plans, stats } });
  } catch (error) {
    console.error("Erreur récupération plans:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// POST Admin - Créer un nouveau plan
app.post("/api/admin/pricing-plans/create", async (req, res) => {
  try {
    const { name, description, price_monthly, max_students, features, is_popular } = req.body;
    const newPlan = { id: Date.now(), name, price_monthly, message: "Plan créé avec succès" };
    res.status(201).json({ success: true, data: newPlan });
  } catch (error) {
    console.error("Erreur création plan:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la création" });
  }
});

// PUT Admin - Modifier un plan existant
app.put("/api/admin/pricing-plans/:id", async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    const { name, price_monthly, max_students, features, is_popular } = req.body;

    const updatedPlan = { id: planId, name, price_monthly, message: "Plan modifié avec succès" };
    res.json({ success: true, data: updatedPlan });
  } catch (error) {
    console.error("Erreur modification plan:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la modification" });
  }
});

// DELETE Admin - Supprimer un plan
app.delete("/api/admin/pricing-plans/:id", async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    res.json({ success: true, message: "Plan supprimé avec succès", deletedId: planId });
  } catch (error) {
    console.error("Erreur suppression plan:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la suppression" });
  }
});

// ===========================================
// 🚀 DÉMARRAGE SERVEUR
// ===========================================