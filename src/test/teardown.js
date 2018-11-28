const Promise = require('bluebird');

module.exports = async function() {
    await global.__MONGOD__.stop();

    // Предыдущая функция оставляет хвосты и jest сообщает о том что что-то подвисло - пусть еще подождет
    await Promise.delay(1000);
};
