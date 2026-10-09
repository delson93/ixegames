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
test('public admin origin works when proxy headers or SITE_URL are stale, but forged forwarded hosts cannot authorize writes',()=>{
 const req={headers:{host:'127.0.0.1:3000'},socket:{}};
 assert.ok(acceptedRequestOrigins(req,'http://localhost:3000').has('https://games.upilinks.in'));
 const forged={headers:{host:'127.0.0.1:3000','x-forwarded-host':'evil.example','x-forwarded-proto':'https'},socket:{}};
 assert.ok(!acceptedRequestOrigins(forged,'http://localhost:3000').has('https://evil.example'));
});
