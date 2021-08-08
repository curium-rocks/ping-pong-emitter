import { IDataEmitter, ProviderSingleton } from "@curium.rocks/data-emitter-base";
import { PingPongEmitter } from "../src/pingPongEmitter";
import { PingPongEmitterFactory } from "../src/pingPongEmitterFactory";
import { describe, it} from 'mocha';
import { expect } from 'chai';
import crypto from 'crypto';
import { IDisposable } from "@curium.rocks/data-emitter-base/build/src/dataEmitter";

const factory = new PingPongEmitterFactory();
ProviderSingleton.getInstance().registerEmitterFactory(PingPongEmitter.TYPE, factory);

const testDescription = {
    type: PingPongEmitter.TYPE,
    id: 'test',
    description: 'test-desc',
    name: 'test-name',
    emitterProperties: {
        interval: 2500,
    }
}

/**
 * 
 * @param {IDataEmitter} newEmitter 
 */
function validateEmitterMatch(newEmitter:IDataEmitter) : void {
    expect(newEmitter).to.be.instanceOf(PingPongEmitter);
    const pingPongEmitter = newEmitter as PingPongEmitter;
    expect(pingPongEmitter.name).to.be.eq(testDescription.name);
    expect(pingPongEmitter.id).to.be.eq(testDescription.id);
    expect(pingPongEmitter.description).to.be.eq(testDescription.description);
}
/**
 * 
 * @param {IDisposable} emitter 
 */
function stopEmitter(emitter: IDataEmitter) : void {
    (emitter as unknown as IDisposable).dispose();
}


describe('PingPongEmitterFactory', function() {
    describe('buildEmitter()', function() {
        it('Should be created to specification', async function() {
            const emitter = await ProviderSingleton.getInstance().buildEmitter(testDescription);
            try {
                validateEmitterMatch(emitter);
            } finally {
                stopEmitter(emitter);
            }
        });
    });
    describe('recreateEmitter()', function() {
        it('Should recreate from plaintext', async function() {
            const emitter = await ProviderSingleton.getInstance().buildEmitter(testDescription);
            try {
                validateEmitterMatch(emitter);
                const result = await emitter.serializeState({
                    encrypted: false,
                    type: PingPongEmitter.TYPE
                })
                const recreatedEmitter = await ProviderSingleton.getInstance().recreateEmitter(result, {
                    encrypted: false,
                    type: PingPongEmitter.TYPE
                });
                validateEmitterMatch(recreatedEmitter);
                stopEmitter(recreatedEmitter);
            } finally {
                stopEmitter(emitter);
            }
        });
        it('Should recreate from aes-256-gcm', async function() {
            const emitter = await ProviderSingleton.getInstance().buildEmitter(testDescription);
            try {
                validateEmitterMatch(emitter);
                const formatSettings = {
                    encrypted: true,
                    type: PingPongEmitter.TYPE,
                    algorithm: 'aes-256-gcm',
                    iv: crypto.randomBytes(32).toString('base64'),
                    key: crypto.randomBytes(32).toString('base64')
                };
                const result = await emitter.serializeState(formatSettings);
                const recreatedEmitter = await ProviderSingleton.getInstance().recreateEmitter(result, formatSettings);
                validateEmitterMatch(recreatedEmitter);
                stopEmitter(recreatedEmitter);
            } finally {
                stopEmitter(emitter);
            }
        });
    });
});