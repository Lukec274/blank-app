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
/* Dropping in a different model
   ----------------------------
   Put the .glb in tools/glb/, then:

     node tools/bake.js --inspect <file.glb>     what rig is it, do the clips bind
     node tools/bake.js <unit>                   bake just that unit
     python3 tools/quantise.py                   shrink the sheets
     python3 tools/embed_assets.py               inline them into the game

   Same rig as the stock mannequin (KayKit) -- the whole animation library
   retargets, so only `mesh` changes:

     militia:{ mesh:'knight.glb', keepMaterials:true, hat:'helm', weapon:'sword',
               states:[S.idle,S.walk,{name:'attack',clip:'Melee_1H_Attack_Slice_Diagonal',n:5},S.die] },

   Different rig carrying its own clips -- name them with clipMap, keyed by the
   clip names the states below ask for:

     militia:{ mesh:'gen_militia.glb', keepMaterials:true,
               clipMap:{ Idle_A:'Idle_Loop', Walking_B:'Walk_Loop',
                         Melee_1H_Attack_Slice_Diagonal:'Sword_Attack', Death_A:'Death01' },
               states:[S.idle,S.walk,{name:'attack',clip:'Melee_1H_Attack_Slice_Diagonal',n:5},S.die] },

   keepMaterials:true keeps the model's own textures instead of the flat per-part
   materials below. Team colour then has to come from somewhere else: either ask
   for a plain tabard you can key to magenta, or let the building pennant and the
   selection ring carry ownership. `parts` maps the trailing word of each mesh
   name (Mannequin_Medium_Body -> Body) onto an entry in MATS. */
const UNITS={
  /* KayKit's Adventurers pack: same rig as the mannequin, so the shared clip
     library still drives everything. Weapons, shields, helmets and capes are
     meshes inside each file -- `show` picks the ones this unit carries, and
     `teamMesh` keys one garment to the player colour, since keeping the pack's
     textures otherwise loses ownership entirely. */
  villager:{mesh:'kit_rogue.glb', keepMaterials:true, teamMesh:'Rogue_Body', show:[],
    weapon:'axe',
    states:[S.idle,S.walk,{name:'attack',clip:'Chopping',n:5},
            {name:'work',clip:'Chopping',n:5},{name:'mine',clip:'Pickaxing',n:5},
            {name:'build',clip:'Hammering',n:5},S.die]},
  militia:{mesh:'kit_knight.glb', keepMaterials:true, teamMesh:'Round_Shield',
    show:['1H_Sword','Round_Shield'],
    states:[S.idle,S.walk,{name:'attack',clip:'Melee_1H_Attack_Slice_Diagonal',n:5},S.die]},
  spearman:{mesh:'kit_barbarian.glb', keepMaterials:true, teamMesh:'Barbarian_Body', show:[],
    weapon:'spear',
    states:[S.idle,S.walk,{name:'attack',clip:'Melee_2H_Attack_Stab',n:5},S.die]},
  archer:{mesh:'kit_rogue_hooded.glb', keepMaterials:true, teamMesh:'Rogue_Cape',
    show:['2H_Crossbow','Rogue_Cape'],
    states:[{name:'idle',clip:'Ranged_Bow_Idle',n:2},{name:'walk',clip:'Running_HoldingBow',n:6},
            {name:'attack',clip:'Ranged_Bow_Draw',n:5},S.die]},
  skirmisher:{mesh:'kit_rogue.glb', keepMaterials:true, teamMesh:'Rogue_Body',
    show:['Throwable'],
    states:[S.idle,S.walk,{name:'attack',clip:'Throw',n:5},S.die]},
  pavise:{mesh:'kit_knight.glb', keepMaterials:true, teamMesh:'Rectangle_Shield',
    show:['1H_Sword','Rectangle_Shield','Knight_Helmet'],
    states:[S.idle,S.walk,{name:'attack',clip:'Melee_1H_Attack_Chop',n:5},S.die]},
  monk:{mesh:'kit_mage.glb', keepMaterials:true, teamMesh:'Mage_Cape',
    show:['2H_Staff','Mage_Cape'],
    states:[S.idle,S.walk,{name:'attack',clip:'Ranged_Magic_Shoot',n:5},S.die]},
  scout:{mesh:'kit_rogue.glb', keepMaterials:true, teamMesh:'Rogue_Cape',
    show:['Knife','Rogue_Cape'], mount:{col:0x8a6740,dark:0x4a3520},
    states:[{name:'idle',clip:'Sit_Chair_Idle',n:2},{name:'walk',clip:'Sit_Chair_Idle',n:6},
            {name:'attack',clip:'Melee_1H_Attack_Slice_Diagonal',n:5},S.die]},
  knight:{mesh:'kit_knight.glb', keepMaterials:true, teamMesh:'Knight_Cape',
    show:['1H_Sword','Round_Shield','Knight_Helmet','Knight_Cape'],
    mount:{col:0x4a4a55,dark:0x26262e},
    states:[{name:'idle',clip:'Sit_Chair_Idle',n:2},{name:'walk',clip:'Sit_Chair_Idle',n:6},
            {name:'attack',clip:'Melee_1H_Attack_Slice_Diagonal',n:5},S.die]},
  windrider:{mesh:'kit_rogue_hooded.glb', keepMaterials:true, teamMesh:'Rogue_Cape',
    show:['2H_Crossbow','Rogue_Cape'], mount:{col:0x9a7448,dark:0x54402a},
    states:[{name:'idle',clip:'Sit_Chair_Idle',n:2},{name:'walk',clip:'Sit_Chair_Idle',n:6},
            {name:'attack',clip:'Ranged_Bow_Draw',n:5},S.die]},
  cataphract:{mesh:'kit_knight.glb', keepMaterials:true, teamMesh:'Knight_Cape',
    show:['Spike_Shield','Knight_Helmet','Knight_Cape'], weapon:'spear',
    mount:{col:0x3e3a46,dark:0x1f1d24},
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
  /* --inspect <file.glb>: report whether a candidate model can stand in for the
     stock mannequin, instead of finding out from 33 T-posed frames. */
  if(process.argv[2]==='--inspect'){
    const file=process.argv[3];
    if(!file){ console.error('usage: node tools/bake.js --inspect <file.glb>'); process.exit(2); }
    const r=await page.evaluate(([f,a])=>window.__inspect(f,a),[file,A]);
    const pct=(n)=>String(n).padStart(3)+'%';
    console.log('\n'+r.file);
    console.log('  height        '+r.height+' world units  (stock mannequin is 2.204)');
    console.log('  bones         '+r.bones.length);
    console.log('  meshes        '+r.meshes.map(m=>m.name+(m.textured?' [tex]':'')).join(', '));
    if(r.ownClips.length) console.log('  own clips     '+r.ownClips.join(', '));
    console.log('  shared clips  '+pct(r.clipBindingAvg)+' of animation tracks bind to this skeleton');
    if(r.rigMissing.length) console.log('  MISSING bones '+r.rigMissing.join(', '));
    if(r.rigExtra.length)   console.log('  extra bones   '+r.rigExtra.slice(0,12).join(', ')+(r.rigExtra.length>12?' ...':''));

    const ok=r.rigMissing.length===0;
    console.log('');
    if(ok){
      console.log('  VERDICT  same rig. Set mesh:\''+file+'\' on a unit and every existing');
      console.log('           clip retargets. Add keepMaterials:true to keep its textures.');
    } else if(r.ownClips.length){
      console.log('  VERDICT  different rig, but it carries its own clips. Use mesh: with a');
      console.log('           clipMap: mapping the game state names onto those clip names,');
      console.log('           and keepMaterials:true. Procedural weapons and hats need');
      console.log('           hand/head bones -- absent here, so they will not attach.');
    } else {
      console.log('  VERDICT  different rig and no clips of its own. Not usable as a drop-in');
      console.log('           without retargeting onto the stock skeleton first.');
    }
    if(Math.abs(r.height-2.204)>0.6){
      console.log('  NOTE     height differs a lot from the stock model; attachments scale off');
      console.log('           the body box, so check weapon and hat size in the first bake.');
    }
    console.log('');
    await br.close(); srv.close(); return;
  }

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
