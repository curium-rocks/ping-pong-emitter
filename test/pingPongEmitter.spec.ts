import {describe, it} from 'mocha';
import {expect} from 'chai';
import {isPingPongMessage, PingPongEmitter, PingPongMessage, PingPongMessageType} from '../src/pingPongEmitter';
import {IDataEvent} from '@curium.rocks/data-emitter-base';

/**
 * A helper to evaluate at a delayed time
 * @param {number} ms
 * @return {Promise}
 */
function sleep(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const testId = 'test-id';
const testName = 'test-name';
const testDesc = 'test-desc';
const testActionId = 'test-action-id';

describe( 'PingPongEmitter', function() {
    describe( 'sendCommand()', function() {
        it( 'Should ack command', async function() {
            const emitter = new PingPongEmitter(testId, testName, testDesc, 100);
            const result = await emitter.sendCommand({
                actionId: testActionId,
                payload: {
                    type: PingPongMessageType.PING
                } as PingPongMessage
            });
            expect(result.actionId).to.be.eq(testActionId);
            expect(result.success).to.be.true;
            emitter.dispose();
        });
        it('Should send a pong when pinged', async function(){
           const emitter = new PingPongEmitter(testId, testName, testDesc, 500);
           let ponged = false;
           const disposable = emitter.onData((evt)=>{
               if((evt.data as PingPongMessage).type == PingPongMessageType.PONG) ponged = true;
           });
           const result = await emitter.sendCommand({
               actionId: testActionId,
               payload: {
                   type: PingPongMessageType.PING
               }
           });
           expect(result.actionId).to.be.eq(testActionId);
           expect(result.success).to.be.true;
           await sleep(100);
           expect(ponged).to.be.true;
           emitter.stopPolling();
           disposable.dispose();
           emitter.dispose();
        });
        it('Should keep ping-ponger alive when it receives a pong', async function(){
            const emitter = new PingPongEmitter(testId, testName, testDesc, 100);
            emitter.startPolling();
            const disposable = emitter.onData(async (evt) => {
                if((evt.data as PingPongMessage).type == PingPongMessageType.PING) await emitter.sendCommand({
                    actionId: testActionId,
                    payload: {
                        type: PingPongMessageType.PONG
                    }
                });
            });
            await sleep(500);
            const status = await emitter.probeStatus();
            expect(status.bit).to.be.false;
            emitter.stopPolling();
            disposable.dispose();
            emitter.dispose();
        });
        it('Should fault when not ponged', async function(){
            const emitter = new PingPongEmitter(testId, testName, testDesc, 100);
            await sleep(500);
            const status = await emitter.probeStatus();
            expect(status.bit).to.be.true;
            emitter.stopPolling();
            emitter.dispose();
        });
    });
    describe('onData()', function(){
        it('Should emit ping messages', async function(){
            let pingCount = 0;
            const emitter = new PingPongEmitter(testId, testName, testDesc, 100);
            const disposable = emitter.onData((evt)=>{
                expect(evt).to.not.be.null;
                expect(isPingPongMessage(evt.data)).to.be.true;
                pingCount++;
            }); 
            emitter.startPolling();
            await sleep(550);
            expect(pingCount).to.be.eq(5);
            emitter.stopPolling();
            disposable.dispose();
            emitter.dispose();
        });
    });
    describe('probeCurrentData()', function(){
        it('Should provide the last ping sent', async function() {
            let dataEvt:IDataEvent|unknown = {};
            const emitter = new PingPongEmitter(testId, testName, testDesc, 100);
            const disposable = emitter.onData((evt)=>{
                dataEvt = evt;
            });
            emitter.startPolling();
            await sleep(150);
            const probedData = await emitter.probeCurrentData();
            expect(probedData).to.not.be.null;
            expect(probedData.timestamp).to.eq((dataEvt as IDataEvent).timestamp);
            emitter.stopPolling();
            disposable.dispose();
            emitter.dispose();
        });
    });
    describe('probeStatus()', function(){
        it('Should provide current state of emitter', async function(){
            const emitter = new PingPongEmitter(testId, testName, testDesc, 100);
            const status = await emitter.probeStatus();
            expect(status.bit).to.be.false;
            expect(status.connected).to.be.false;
            expect(status.timestamp).to.not.be.null;
            emitter.startPolling();
            await sleep(200);
            const newStatus = await emitter.probeStatus();
            emitter.stopPolling();
            expect(newStatus.connected).to.be.true;
            emitter.dispose();
        });
    });
    describe('applySettings()', function(){
        it('Should allow changing ping interval', async function(){
            let pingCount = 0;
            const emitter = new PingPongEmitter(testId, testName, testDesc, 1000);
            const disposable = emitter.onData((evt)=>{
                expect(evt).to.not.be.null;
                expect(isPingPongMessage((evt.data))).to.be.true;
                pingCount++;
            });

            const result = await emitter.applySettings({
                actionId: testActionId,
                additional: {},
                interval: 100,
                name: testName,
                description: testDesc,
                id: testId
            });
            emitter.startPolling();
            expect(result.actionId).to.be.eq(testActionId);
            expect(result.success).to.be.true;
            await sleep(550);
            expect(pingCount).to.be.eq(5);
            emitter.stopPolling();
            disposable.dispose();
            emitter.dispose();
        });
        it('Should allow changing name, description, and id', async function(){
            const emitter = new PingPongEmitter(testId, testName, testDesc, 500);
            const result = await emitter.applySettings({
                actionId: testActionId,
                id: 'new-id',
                name: 'new-name',
                description: 'new-description',
                additional: {},
                interval: 500
            });
            expect(result.actionId).to.be.eq(testActionId);
            expect(emitter.id).to.be.eq('new-id');
            expect(emitter.name).to.be.eq('new-name');
            expect(emitter.description).to.be.eq('new-description');
            emitter.stopPolling();
            emitter.dispose();
        });
    });
});