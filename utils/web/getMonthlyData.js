const MsmeInformation = require('../../models/msmeInformation');
const {Sequelize,Op} = require('sequelize');

async function getMonthlyData(year, month) {
    const currentMonthCount = await MsmeInformation.count({
        where: {
            [Op.and]: [
                Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('createdAt')), year),
                Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('createdAt')), month)
            ]
        }
    });

    const previousMonthCount = await MsmeInformation.count({
        where: {
            [Op.and]: [
                Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('createdAt')), year - 1),
                Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('createdAt')), month)
            ]
        }
    });

    return {
        date: `${year}-${month.toString().padStart(2, '0')}`,
        currentMonth: currentMonthCount,
        previousMonth: previousMonthCount
    };
}

module.exports = {
    getMonthlyData
};