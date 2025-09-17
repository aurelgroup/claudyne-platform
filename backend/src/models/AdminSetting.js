/**
 * Modèle Sequelize pour les Paramètres Admin
 * Configuration globale de la plateforme - Claudyne
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AdminSetting = sequelize.define('AdminSetting', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    value: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM,
      values: ['platform', 'pricing', 'features', 'notifications', 'payments', 'content', 'security'],
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastModifiedBy: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'admin_settings',
    timestamps: true,
    indexes: [
      {
        fields: ['key'],
        unique: true
      },
      {
        fields: ['category']
      },
      {
        fields: ['isPublic']
      }
    ]
  });

  // Méthodes statiques
  AdminSetting.get = async function(key, defaultValue = null) {
    const setting = await this.findOne({ where: { key } });
    return setting ? setting.value : defaultValue;
  };

  AdminSetting.set = async function(key, value, category, description, modifiedBy) {
    const [setting, created] = await this.findOrCreate({
      where: { key },
      defaults: {
        key,
        value,
        category,
        description,
        lastModifiedBy: modifiedBy
      }
    });

    if (!created) {
      setting.value = value;
      setting.lastModifiedBy = modifiedBy;
      if (description) setting.description = description;
      await setting.save();
    }

    return setting;
  };

  return AdminSetting;
};