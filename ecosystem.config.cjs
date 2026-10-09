const path=require('node:path');
module.exports={apps:[{
 name:'node-app',
 script:path.join(__dirname,'server.js'),
 cwd:__dirname,
 node_args:[`--env-file=${path.join(__dirname,'.env')}`],
 instances:1,
 exec_mode:'fork',
 env:{NODE_ENV:'production',SITE_URL:'https://games.upilinks.in',COOKIE_SECURE:'true'}
}]};
