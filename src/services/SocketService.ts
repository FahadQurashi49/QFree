import { Namespace } from "socket.io";

export class SocketService {
    private static _instance: SocketService;
    facilityNsp: Namespace;

    private constructor() {}

    public static get Instance(): SocketService {
        return this._instance || (this._instance = new this());
    }
}