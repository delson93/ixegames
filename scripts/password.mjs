import {randomBytes,scryptSync} from 'node:crypto';
import {createInterface} from 'node:readline/promises';
const rl=createInterface({input:process.stdin,output:process.stdout});
console.log('Run in a private terminal. Input is visible and is not stored.');
const password=await rl.question('New administrator password (at least 16 characters): ');rl.close();
if(password.length<16){console.error('Use at least 16 characters.');process.exit(1);}
const salt=randomBytes(16).toString('hex');console.log(`ADMIN_PASSWORD_HASH=${salt}:${scryptSync(password,salt,64).toString('hex')}`);
