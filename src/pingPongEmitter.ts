import {ICommand, IExecutionResult, PollingEmitter} from '@curium.rocks/data-emitter-base';

export enum PingPongMessageType {
    PING,
    PONG
}

export interface PingPongMessage {
    type: PingPongMessageType
}
/**
 * Checks if the object is a PingPongMessage
 * @param {unknown} obj 
 * @return {boolean}
 */
export function isPingPongMessage(obj:unknown) : boolean {
    return Object.prototype.hasOwnProperty.call(obj, "type");
}

/**
 * 
 */
export class PingPongEmitter extends PollingEmitter {

    public static readonly TYPE = 'PING-PONG-EMITTER';

    private lastPongRecvMs = 0;
    private pongCheckerHandler?: ReturnType<typeof setInterval>;
    private failureThresholdMs = 0;
    private pingIntervalMs = 0;

    /**
     * 
     * @param {string} id 
     * @param {string} name 
     * @param {string} desc 
     * @param {number} pingInterval
     */
    constructor(id:string, name:string, desc:string, pingInterval:number) {
        super(id,name,desc,pingInterval);
        this.failureThresholdMs = pingInterval * 3;
        // check the last received pong and change the BIT based on that.
        this.pongCheckerHandler = setInterval(this.checkLastPong.bind(this), pingInterval*2);
        this.pingIntervalMs = pingInterval;
    }

    /**
     * Record that we received a pong response
     */
    private recordPong(): void {
        this.lastPongRecvMs = new Date().getTime();
        this.checkLastPong();
    }

    /**
     * Check the last time we received a pong and update the BIT status based on that.
     */
    private checkLastPong(): void {
        if((new Date().getTime() - this.lastPongRecvMs) > this.failureThresholdMs) {
            this.faulted();
        } else {
            this.clearIfFaulted();
        }
    }

    /**
     * 
     * @return {Promise<unknown>}
     */
    poll(): Promise<unknown> {
        return Promise.resolve({
            type: PingPongMessageType.PING
        } as PingPongMessage)
    }
    /**
     * 
     * @param {ICommand} command 
     * @return {Promise<IExecutionResult>}
     */
    sendCommand(command: ICommand): Promise<IExecutionResult> {
        try {
            if(isPingPongMessage(command.payload)) {
                const mess: PingPongMessage = command.payload as PingPongMessage;
                if(mess.type == PingPongMessageType.PING) {
                    // respond, ack the message and send a  pong
                    this.notifyDataListeners(this.buildDataEvent({
                        type: PingPongMessageType.PONG
                    }));
                    return Promise.resolve({
                        actionId: command.actionId,
                        success: true
                    });
                } else {
                    // record we got the pong
                    this.recordPong();
                    return Promise.resolve({
                        actionId: command.actionId,
                        success: true
                    })
                }
            }
        } catch (error){
            return Promise.resolve({
                actionId: command.actionId,
                success: false,
                failureReason: "internal error"
            })
        }
        // if we reach this it's an unknown command, mark failed
        return Promise.resolve({
            actionId: command.actionId,
            success: false,
            failureReason: 'unknown command'
        });
    }

    /**
     * 
     * @return {unknown}
     */
    getMetaData(): unknown {
        return {
            pingInterval: this.pingIntervalMs,
            pongTimeout: this.failureThresholdMs,
            lastPongRecv: this.lastPongRecvMs
        };
    }

    /**
     * 
     * @return {unknown} 
     */
    getEmitterProperties(): unknown {
        return {
            interval: this.pingIntervalMs
        }
    }

    /**
     * Cleanup resources created such as timers
     */
    override dispose() : void {
        super.dispose();
        if(this.pongCheckerHandler) {
            clearInterval(this.pongCheckerHandler);
        }
    }

    /**
     * Get the emitter type
     * @return {string} 
     */
    public getType(): string {
        return PingPongEmitter.TYPE;
    }
}