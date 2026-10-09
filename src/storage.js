import {loadSettings as loadFile,saveSettings as saveFile,defaults} from './settings.js';

// PostgreSQL is selected only when connection details are present. The file mode
// preserves existing local deployments and provides a migration source.
export async function createStorage({dataDir,env=process.env,Pool}={}){
 const database=Boolean(env.DATABASE_URL||env.PGDATABASE);
 if(!database)return {
  mode:'file',
  loadSettings:()=>loadFile(dataDir),
  saveSettings:value=>saveFile(dataDir,value),
  getAdmin:async()=>({username:env.ADMIN_USERNAME||'admin',password_hash:env.ADMIN_PASSWORD_HASH||''}),
  updateAdmin:async()=>{throw Error('Configure PostgreSQL before changing the admin account.');},
  close:async()=>{}
 };
 const PgPool=Pool||((await import('pg')).default.Pool);
 const options={max:5,connectionTimeoutMillis:5000};
 if(env.DATABASE_URL)options.connectionString=env.DATABASE_URL;
 if(env.PGSSL==='true')options.ssl={rejectUnauthorized:true};
 const pool=new PgPool(options);
 try{
  await pool.query('CREATE TABLE IF NOT EXISTS upgames_settings (id integer PRIMARY KEY CHECK (id = 1), data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())');
  await pool.query('CREATE TABLE IF NOT EXISTS upgames_admin (id integer PRIMARY KEY CHECK (id = 1), username text NOT NULL, password_hash text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())');
  const legacy=await loadFile(dataDir);
  await pool.query('INSERT INTO upgames_settings (id, data) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING',[JSON.stringify(legacy)]);
  if(env.ADMIN_PASSWORD_HASH){
   await pool.query('INSERT INTO upgames_admin (id, username, password_hash) VALUES (1, $1, $2) ON CONFLICT (id) DO NOTHING',[env.ADMIN_USERNAME||'admin',env.ADMIN_PASSWORD_HASH]);
  }
 }catch(error){await pool.end();throw error;}
 return {
  mode:'postgres',
  async loadSettings(){const result=await pool.query('SELECT data FROM upgames_settings WHERE id = 1');return {...defaults,...result.rows[0].data};},
  async saveSettings(value){await pool.query('UPDATE upgames_settings SET data = $1::jsonb, updated_at = now() WHERE id = 1',[JSON.stringify(value)]);},
  async getAdmin(){const result=await pool.query('SELECT username, password_hash FROM upgames_admin WHERE id = 1');return result.rows[0]||null;},
  async updateAdmin(username,passwordHash){await pool.query('UPDATE upgames_admin SET username = $1, password_hash = $2, updated_at = now() WHERE id = 1',[username,passwordHash]);},
  close:()=>pool.end()
 };
}
