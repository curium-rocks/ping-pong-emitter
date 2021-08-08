import { BaseEmitter, IDataEmitter, IEmitterDescription, IEmitterFactory, IFormatSettings, LoggerFacade } from "@curium.rocks/data-emitter-base";
import { PingPongEmitter } from "./pingPongEmitter";

/**
 * 
 */
export class PingPongEmitterFactory implements IEmitterFactory {
    private _loggerFacade?: LoggerFacade;
    /**
     * 
     * @param {IEmitterDescription} description 
     * @return {Promise<IDataEmitter>}
     */
    buildEmitter(description: IEmitterDescription): Promise<IDataEmitter> {
        if(description.emitterProperties == null) return Promise.reject(new Error("Missing required emitter properties"));
        const props = description.emitterProperties as Record<string, unknown>;
        if(props.interval == null) return Promise.reject(new Error("Missing required interval property"));
        return Promise.resolve(
            new PingPongEmitter(description.id, 
                description.name, 
                description.description, props.interval as number))
    }
    /**
     * 
     * @param {string} base64StateData 
     * @param {IFormatSettings} formatSettings
     * @return {Promise<IDataEmitter>}
     */
    recreateEmitter(base64StateData: string, formatSettings: IFormatSettings): Promise<IDataEmitter> {
        return BaseEmitter.recreateEmitter(base64StateData, formatSettings);
    }
    /**
     * 
     * @param {LoggerFacade} loggerFacade 
     */
    setLoggerFacade(loggerFacade: LoggerFacade): void {
        this._loggerFacade = loggerFacade;
    }
    
}