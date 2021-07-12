import { describe, it} from 'mocha';
import { should } from 'chai';

describe( 'PingPongEmitter', function() {
    describe( 'sendCommand()', function() {
        it( 'Should ack command', function() {
            should().equal(true, false);
        });
        it('Should send a pong when pinged', function(){
            should().equal(true, false);
        });
        it('Should keep ping-ponger alive when it receives a pong', function(){
            should().equal(true, false);
        });
        it('Should fault when not ponged', function(){
            should().equal(true, false);
        });
    });
    describe('onData()', function(){
        it('Should emit ping messages', function(){
            should().equal(true, false);
        });
    });
    describe('probeCurrentData()', function(){
        it('Should provide the last ping sent', function(){
            should().equal(true, false);
        });
    });
    describe('probeStatus()', function(){
        it('Should provide current state of emitter', function(){
            should().equal(true, false);
        });
    });
    describe('applySettings()', function(){
        it('Should allow changing ping interval', function(){
            should().equal(true, false);
        });
        it('Should allow changing name, description, and id', function(){
            should().equal(true, false);
        });
    });
});