var schedule = require('node-schedule');

exports.scheduleDateTime = () => {
    schedule.scheduleJob('2 * * * *', function () {
        console.log('\n       * Date Changed  *');
        
    });
}