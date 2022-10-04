const { CronJob } = require('cron');
const CronLog = require('../models/CronLog');
const DishItem = require('../models/DishItem');
const { CheckAndProcessQuorum } = require('./quorum.controller');

const cron_for_every_hour = "0 * * * *";

// check for quorum
const checkForQuorums = async () => {

    console.log("checkForQuorums started!");

    const nowTime = new Date();

    const itemsFrQuorumProcess = await DishItem.find({
        $and: [
            {status: 'active'},
            {closingDate: nowTime}
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

const checkFrMorningPickupReminders = () => {

}

const checkFr24HourBeforePickupReminders = () => {

}

var job1 = new CronJob(cron_for_every_hour, checkForQuorums, null, true, "America/Los_Angeles");
var job2 = new CronJob(cron_for_every_hour, checkFrMorningPickupReminders, null, true, "America/Los_Angeles");
var job3 = new CronJob(cron_for_every_hour, checkFr24HourBeforePickupReminders, null, true, "America/Los_Angeles");

[job1,job2,job3].forEach(job=>{
    job.start();
})

