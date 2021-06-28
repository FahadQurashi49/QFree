import { Queue } from "../models/Queue";

export default class Utility {
    public static addSubHours(date: Date, hour: number, subtract: boolean = false) {
    const temp = new Date(date);
    if (!subtract) {
        temp.setTime(temp.getTime() + (hour*60*60*1000));
    } else {
        temp.setTime(temp.getTime() - (hour*60*60*1000));
    }
    return temp;
    }
    public static calcTotalSlots(queue: Queue) {
        // queue serving time duration in minute
        const qstStart = new Date(queue.servingTimeStart);
        const qstEnd = new Date(queue.servingTimeEnd);
        const qst_tp = 
            ((qstEnd.getTime() - qstStart.getTime())/
                1000)/60;
        const totSlots = Math.floor(qst_tp/
            (queue.timeToServe + (queue.breakTimeDuration? queue.breakTimeDuration: 0)));
        return totSlots;
    };
    
}