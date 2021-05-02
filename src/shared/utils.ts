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
}