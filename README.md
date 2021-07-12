# ping-pong-emitter
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=curium-rocks_ping-pong-emitter&metric=alert_status)](https://sonarcloud.io/dashboard?id=curium-rocks_ping-pong-emitter) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=curium-rocks_ping-pong-emitter&metric=coverage)](https://sonarcloud.io/dashboard?id=curium-rocks_ping-pong-emitter) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=curium-rocks_ping-pong-emitter&metric=security_rating)](https://sonarcloud.io/dashboard?id=curium-rocks_ping-pong-emitter)
## Purpose
The purpose of this class is to create an emitter that will perodicially emit a ping message expecting a pong response. Likewise it can be pinged and it will send a pong back. This can be used as a test class for emitter transcievers, as well as a generally comm link check akin to a keep alive.

## How to use

### Install

`npm install --save @curium.rocks/ping-pong-emitter`


### Examples

```typescript
import {isPingPongMessage, PingPongEmitter, PingPongMessage, PingPongMessageType} from '@curium.rocks/ping-pong-emitter';
import {IDataEvent} from '@curium.rocks/data-emitter-base';

const emitter = new PingPongEmitter('unique-id', 'usefull-name', 'lengthy description', 1000);
emitter.startPolling();
const disposable = emitter.onData(async (evt) => {
    if(!isPingPongMessage(evt.data)) console.log('What... not a ping pong message!');
    if((evt.data as PingPongMessage).type == PingPongMessageType.PING) {
        console.log("I've been pinged!, I better send a pong");
        await emitter.sendCommand({
            actionId: 'unique-action-id',
            payload: {
                type: PingPongMessageType.PONG
            }
        });
        console.log("Ponged back!");
    }
});

// check on the state 

const state = await emitter.probeStatus();

if (state.bit) {
    console.log('BIT flag on indicates BIT failure, not getting pongs!');
}

// want to change the ping interval

const cmdResult = await emitter.sendCommand({
    actionId: 'unique-id',
    name: 'new-name',
    id: 'new-emitter-id',
    description: 'new-emitter-description',
    interval: 5000 //interval in ms
});

// check cmd result

if(!cmdResult.success) {
    console.log(`Error while executing cmd: ${cmdResult.actionId}, reason: ${cmdResult.failureReason}`);
}

// when done cleanup
emitter.dispose();
```