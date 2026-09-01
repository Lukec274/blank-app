const {chromium}=require('/tmp/claude-0/-home-user-blank-app/915f20c9-7396-5b0a-aff5-eca381d3f04d/scratchpad/node_modules/playwright-core');
const http=require('http'),fs=require('fs'),path=require('path');
const OUT='/home/user/blank-app/game/assets';
fs.mkdirSync(OUT,{recursive:true});
const A=['CombatMelee','CombatRanged','General','MovementBasic','MovementAdvanced','Tools','Simulation'];
/* state table: what the game asks for -> which KayKit clip and how many frames */
const S={
  idle:  {name:'idle',  clip:'Idle_A',    n:2},
  walk:  {name:'walk',  clip:'Walking_B', n:6},
  die:   {name:'die',   clip:'Death_A',   n:5, from:0, to:.85},
};
const UNITS={
  villager:{hat:'cap', weapon:'axe', parts:{LegLeft:'leather',LegRight:'leather'},
    states:[S.idle,S.walk,{name:'attack',clip:'Chopping',n:5},
            {name:'work',clip:'Chopping',n:5},{name:'mine',clip:'Pickaxing',n:5},
            {name:'build',clip:'Hammering',n:5},S.die]},
  militia:{hat:'helm', weapon:'sword', shield:'round', parts:{LegLeft:'dark',LegRight:'dark'},
    states:[S.idle,S.walk,{name:'attack',clip:'Melee_1H_Attack_Slice_Diagonal',n:5},S.die]},
  spearman:{hat:'helm', weapon:'spear', parts:{LegLeft:'leather',LegRight:'leather'},
    states:[S.idle,S.walk,{name:'attack',clip:'Melee_2H_Attack_Stab',n:5},S.die]},
  archer:{hat:'hood', weapon:'bow', parts:{Body:'team',LegLeft:'wood',LegRight:'wood'},
    states:[{name:'idle',clip:'Ranged_Bow_Idle',n:2},{name:'walk',clip:'Running_HoldingBow',n:6},
            {name:'attack',clip:'Ranged_Bow_Draw',n:5},S.die]},
  skirmisher:{hat:'cap', weapon:'spear', parts:{Body:'team',LegLeft:'cloth',LegRight:'cloth'},
    states:[S.idle,S.walk,{name:'attack',clip:'Throw',n:5},S.die]},
  pavise:{hat:'helm', weapon:'sword', shield:'pavise', parts:{LegLeft:'dark',LegRight:'dark'},
    states:[S.idle,S.walk,{name:'attack',clip:'Melee_1H_Attack_Chop',n:5},S.die]},
  monk:{hat:'hood', weapon:'staff', parts:{Body:'robe',LegLeft:'robe',LegRight:'robe',ArmLeft:'robe',ArmRight:'robe'},
    states:[S.idle,S.walk,{name:'attack',clip:'Ranged_Magic_Shoot',n:5},S.die]},
  scout:{hat:'cap', weapon:'sword', mount:{col:0x8a6740,dark:0x4a3520}, parts:{LegLeft:'dark',LegRight:'dark'},
    states:[{name:'idle',clip:'Sit_Chair_Idle',n:2},{name:'walk',clip:'Sit_Chair_Idle',n:6},
            {name:'attack',clip:'Melee_1H_Attack_Slice_Diagonal',n:5},S.die]},
  knight:{hat:'helmPlume', weapon:'sword', shield:'round', mount:{col:0x4a4a55,dark:0x26262e}, parts:{LegLeft:'dark',LegRight:'dark'},
    states:[{name:'idle',clip:'Sit_Chair_Idle',n:2},{name:'walk',clip:'Sit_Chair_Idle',n:6},
            {name:'attack',clip:'Melee_1H_Attack_Slice_Diagonal',n:5},S.die]},
  windrider:{hat:'cap', weapon:'bow', mount:{col:0x9a7448,dark:0x54402a}, parts:{LegLeft:'leather',LegRight:'leather'},
    states:[{name:'idle',clip:'Sit_Chair_Idle',n:2},{name:'walk',clip:'Sit_Chair_Idle',n:6},
            {name:'attack',clip:'Ranged_Bow_Draw',n:5},S.die]},
  cataphract:{hat:'helmPlume', weapon:'spear', shield:'round', mount:{col:0x3e3a46,dark:0x1f1d24}, parts:{LegLeft:'dark',LegRight:'dark'},
    states:[{name:'idle',clip:'Sit_Chair_Idle',n:2},{name:'walk',clip:'Sit_Chair_Idle',n:6},
            {name:'attack',clip:'Melee_2H_Attack_Stab',n:5},S.die]},
};
/* Generated models (Meshy or otherwise) live in the repo at tools/glb/ so they
   survive the container; the render page serves from /tmp/bake/glb, so stage
   them across before launching. Repo files win over anything already there. */
/* the render page and its module deps are served from /tmp/bake, so the repo copy
   has to be pushed across or edits here silently do nothing */
fs.mkdirSync('/tmp/bake',{recursive:true});
for(const f of ['bake.html'])
  if(fs.existsSync(path.join(__dirname,f)))
    fs.copyFileSync(path.join(__dirname,f),path.join('/tmp/bake',f));

const SRC=path.join(__dirname,'glb'), DST='/tmp/bake/glb';
if(fs.existsSync(SRC)){
  fs.mkdirSync(DST,{recursive:true});
  for(const f of fs.readdirSync(SRC)){
    if(!f.endsWith('.glb'))continue;
    fs.copyFileSync(path.join(SRC,f),path.join(DST,f));
    console.log('staged',f);
  }
}

const srv=http.createServer((q,s)=>{
  let f=path.join('/tmp/bake',decodeURIComponent(q.url.split('?')[0]));
  if(q.url==='/')f='/tmp/bake/bake.html';
  fs.readFile(f,(e,d)=>{ if(e){s.writeHead(404);s.end();return;}
    s.writeHead(200,{'Content-Type':path.extname(f)==='.js'?'text/javascript':path.extname(f)==='.html'?'text/html':'application/octet-stream'});
    s.end(d);});
}).listen(8799,'127.0.0.1',async()=>{
  const br=await chromium.launch({executablePath:process.env.PW_CHROME,
    args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const page=await br.newPage();
  page.on('pageerror',e=>console.log('PAGEERR',e.message));
  await page.goto('http://127.0.0.1:8799/');
  await page.waitForFunction(()=>window.__ready,{timeout:30000});
  const only=process.argv[2];
  /* a single-unit bake must not drop the other units out of the manifest */
  const MF=path.join(OUT,'units.json');
  const manifest=fs.existsSync(MF)?JSON.parse(fs.readFileSync(MF,'utf8')):{};
  for(const [name,cfg] of Object.entries(UNITS)){
    if(only&&name!==only)continue;
    const r=await page.evaluate((c)=>window.__bake(c),{...cfg,animFiles:A});
    const b64=r.png.split(',')[1];
    fs.writeFileSync(path.join(OUT,name+'.png'),Buffer.from(b64,'base64'));
    manifest[name]={fw:r.fw,fh:r.fh,frames:r.frames,anchor:{x:+r.anchor.x.toFixed(2),y:+r.anchor.y.toFixed(2)},states:r.layout};
    const miss=r.layout.filter(l=>l.missing).map(l=>l.name);
    console.log(name.padEnd(11), (b64.length*0.75/1024|0)+'KB', r.frames+' frames', miss.length?('MISSING '+miss.join(',')):'');
  }
  fs.writeFileSync(path.join(OUT,'units.json'),JSON.stringify(manifest,null,1));
  await br.close(); srv.close();
});
