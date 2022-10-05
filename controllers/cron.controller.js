const { CronJob } = require('cron');
const CronLog = require('../models/CronLog');
const DishItem = require('../models/DishItem');
const OrderModel = require('../models/Order');
const { CheckAndProcessQuorum } = require('./quorum.controller');
const { nowTimeToPSTDateP2Hour } = require('../utils/datetime');
const {TwentyFourHourPickupReminder} = require('./notification.controller');

const cron_for_every_hour = "0 * * * *";

// check for quorum
const checkForQuorums = async () => {

    console.log("checkForQuorums started!");

    const closingDate = nowTimeToPSTDateP2Hour();
    closingDate.setDate(closingDate.getDate()-1);

    const itemsFrQuorumProcess = await DishItem.find({
        $and: [
            {status: 'active'},
            {closingDate: closingDate}
        ]
    }, `_id`)

    if (!itemsFrQuorumProcess.length){
        console.log(`No items to process for quorum`)
        return
    }

    for (let i=0; i< itemsFrQuorumProcess.length; i++){

        // check if entry there in db
        const item = itemsFrQuorumProcess[i];

        const existingProcess = await CronLog.findOne({
            $and: [
                {type: 'quorum_process'},
                {id: item._id}
            ]
        })

        if (existingProcess){
            console.log(`Already processing quorum for product`, item._id);
            continue
        }

        await CheckAndProcessQuorum(item._id, false);
    }

}

// checkForQuorums()

const checkFr24HourBeforePickupReminders = async () => {

    // get orders with pickup date 24 hours apart

    console.log("checkFr24HourBeforePickupReminders started!");

    const pickUpTime = nowTimeToPSTDateP2Hour();
    pickUpTime.setDate(pickUpTime.getDate()-1);

    let orders = await OrderModel.find({$and: [{status: 'active'},{pickupDate: pickUpTime}]})
        
    if (!orders.length){
        console.log(`No items to process for 24 hr reminder!`)
        return
    }    

    for(let i=0; i<orders.length; i++){
        let order = orders[i];
        await TwentyFourHourPickupReminder(order._id)
    }

    console.log("checkFr24HourBeforePickupReminders ended!");

    return 
}

// checkFr24HourBeforePickupReminders()

// var job3 = new CronJob(cron_for_every_hour, checkFrMorningPickupReminders, null, true, "America/Los_Angeles");

var job1 = new CronJob(cron_for_every_hour, checkForQuorums, null, true, "America/Los_Angeles");
var job2 = new CronJob(cron_for_every_hour, checkFr24HourBeforePickupReminders, null, true, "America/Los_Angeles");

[job1,job2].forEach(job=>{
    job.start();
})

