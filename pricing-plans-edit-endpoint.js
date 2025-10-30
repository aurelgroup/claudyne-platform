
// Éditer complètement un plan tarifaire
router.put('/pricing-plans/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const { name, description, price, originalPrice, discount, currency, interval, intervalCount, features, status, featured } = req.body;
    const fs = require('fs').promises;
    const path = require('path');
    const configPath = path.join(__dirname, '../../config/pricing-plans-config.json');

    // Charger les plans existants
    const configContent = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configContent);

    // Trouver le plan à mettre à jour
    const planIndex = config.plans.findIndex(p => p.id === planId);
    if (planIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Plan non trouvé'
      });
    }

    // Mettre à jour les champs fournis
    const updatedPlan = {
      ...config.plans[planIndex],
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: parseInt(price) }),
      ...(originalPrice !== undefined && { originalPrice: originalPrice ? parseInt(originalPrice) : null }),
      ...(discount !== undefined && { discount: discount ? parseInt(discount) : null }),
      ...(currency !== undefined && { currency }),
      ...(interval !== undefined && { interval }),
      ...(intervalCount !== undefined && { intervalCount: parseInt(intervalCount) }),
      ...(features !== undefined && { features }),
      ...(status !== undefined && { status }),
      ...(featured !== undefined && { featured }),
      updatedAt: new Date().toISOString()
    };

    config.plans[planIndex] = updatedPlan;
    config.metadata.lastUpdated = new Date().toISOString();

    // Sauvegarder
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');

    logger.info('Plan tarifaire mis à jour', {
      service: 'claudyne-backend',
      action: 'update_pricing_plan',
      planId
    });

    res.json({
      success: true,
      message: 'Plan mis à jour avec succès',
      data: updatedPlan
    });

  } catch (error) {
    logger.error('Erreur mise à jour plan:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du plan',
      error: error.message
    });
  }
});
