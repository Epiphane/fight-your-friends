'use strict';

String.prototype.ucwords = function() {
    return this.replace(/^[a-z]/g, function(l) { return l.toUpperCase(); });
};

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('item', {
        _id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        stats: DataTypes.JSON,
        type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        deleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        getterMethods: {
            stats: function() {
                if (this._stats) return this._stats;

                var stats = this.getDataValue('stats');

                stats.alignment = stats.alignment || 'none';
                stats.physical = stats.physical || 0;
                stats.elemental = stats.elemental || 0;
                stats.luck = stats.luck || 0;
                stats.defense = stats.defense || 0;

                this._stats = stats;
                return stats;
            },
            name: function() {
                return this.getDataValue('name').ucwords();
            },
            desc: function() {
                var result = '';

                if (this.stats.alignment && this.stats.alignment !== 'none') {
                    result += '`' + this.stats.alignment.ucwords() + ' ` alignment, ';
                    result += '`' + this.stats.elemental + ' ' + this.stats.alignment + '` & ';
                }

                result += '`' + this.stats.physical + ' physical` power';

                if (this.stats.luck) {
                    result += ', `' + this.stats.luck + ' luck`';
                }

                if (this.stats.defense) {
                    result += ', `' + this.stats.defense + ' defense`';
                }

                return result;
            }
        }
    });
};