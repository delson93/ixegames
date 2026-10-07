import test from 'node:test';
import assert from 'node:assert/strict';
import {acceptedRequestOrigins} from '../src/origin.js';

test('origin guard accepts configured and reverse-proxy HTTPS origins only',()=>{
 const configured='http://localhost:3000';
 const proxied={headers:{host:'127.0.0.1:3000','x-forwarded-host':'games.upilinks.in','x-forwarded-proto':'https'},socket:{}};
 const accepted=acceptedRequestOrigins(proxied,configured);
 assert.ok(accepted.has(configured));
 assert.ok(accepted.has('https://games.upilinks.in'));
 assert.ok(!accepted.has('https://evil.example'));
});
