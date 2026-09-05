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
/* Buildings, from KayKit's Medieval Hexagon Pack. `tiles` is the footprint in
   game tiles and must match BLD[kind].size, or the sprite will not sit on its
   plot. Baked from the blue set; ownership comes from the pennant propSprite
   composites on top, as it already does for the houses. */
const PROPS={
  /* shoreline scenery */
  water_lily_a:{mesh:'waterlily_A.gltf',  px:120},
  water_lily_b:{mesh:'waterlily_B.gltf',  px:120},
  reed_a:      {mesh:'waterplant_A.gltf', px:95},
  reed_b:      {mesh:'waterplant_B.gltf', px:95},
  reed_c:      {mesh:'waterplant_C.gltf', px:95},
  /* town clutter -- what makes a settlement look lived in rather than placed */
  dec_barrel:{mesh:'barrel.gltf', px:52},
  dec_crate_a_big:{mesh:'crate_A_big.gltf', px:52},
  dec_crate_a_small:{mesh:'crate_A_small.gltf', px:52},
  dec_crate_long_a:{mesh:'crate_long_A.gltf', px:52},
  dec_sack:{mesh:'sack.gltf', px:52},
  dec_pallet:{mesh:'pallet.gltf', px:52},
  dec_wheelbarrow:{mesh:'wheelbarrow.gltf', px:52},
  dec_resource_lumber:{mesh:'resource_lumber.gltf', px:52},
  dec_resource_stone:{mesh:'resource_stone.gltf', px:52},
  dec_weaponrack:{mesh:'weaponrack.gltf', px:52},
  dec_target:{mesh:'target.gltf', px:52},
  dec_tent:{mesh:'tent.gltf', px:52},
  dec_bucket_water:{mesh:'bucket_water.gltf', px:52},
  dec_ladder:{mesh:'ladder.gltf', px:52},
  /* Forest and rock from the same pack as the buildings. trees_*_large through
     _cut give the four depletion stages directly, which beats the procedural
     canvas trees they replace. */
  tree_a0:{mesh:'trees_A_large.gltf',    px:31},
  tree_a1:{mesh:'trees_A_medium.gltf',   px:31},
  tree_a2:{mesh:'trees_A_small.gltf',    px:31},
  tree_a3:{mesh:'trees_A_cut.gltf',      px:31},
  tree_b0:{mesh:'trees_B_large.gltf',    px:31},
  tree_b1:{mesh:'trees_B_medium.gltf',   px:31},
  tree_b2:{mesh:'trees_B_small.gltf',    px:31},
  tree_b3:{mesh:'trees_B_cut.gltf',      px:31},
  tree_c0:{mesh:'tree_single_A.gltf',    px:30},
  tree_c3:{mesh:'tree_single_A_cut.gltf',px:30},
  tree_d0:{mesh:'tree_single_B.gltf',    px:30},
  tree_d3:{mesh:'tree_single_B_cut.gltf',px:30},
  rock_a: {mesh:'rock_single_A.gltf',    px:88},
  rock_b: {mesh:'rock_single_B.gltf',    px:88},
  rock_c: {mesh:'rock_single_C.gltf',    px:88},
  rock_d: {mesh:'rock_single_D.gltf',    px:88},
  rock_e: {mesh:'rock_single_E.gltf',    px:88},
  bld_tc:      {mesh:'building_market_blue.gltf',         tiles:3},
  bld_house:   {mesh:'building_home_A_blue.gltf',         tiles:1},
  bld_mill:    {mesh:'building_windmill_blue.gltf',       tiles:2,
                spin:{node:'building_windmill_top_fan_blue',frames:8,blades:4,axis:'z'}},
  bld_lumber:  {mesh:'building_lumbermill_blue.gltf',     tiles:2},
  bld_mining:  {mesh:'building_mine_blue.gltf',           tiles:2},
  bld_barracks:{mesh:'building_barracks_blue.gltf',       tiles:3},
  bld_range:   {mesh:'building_archeryrange_blue.gltf',   tiles:3},
  bld_smith:   {mesh:'building_blacksmith_blue.gltf',     tiles:2},
  bld_tower:   {mesh:'building_tower_A_blue.gltf',        tiles:1},
  bld_monastery:{mesh:'building_church_blue.gltf',        tiles:3},
  bld_castle:  {mesh:'building_castle_blue.gltf',         tiles:3},
  bld_siege:   {mesh:'building_tower_catapult_blue.gltf', tiles:3},
  /* A stable, a second house and the three civ landmarks. Without these the
     game fell back to the procedural sprites for them, and a flat-shaded canvas
     building standing in a street of baked models is worse than either. */
  /* No stable in the pack. The lumber mill is an open timber barn, which is
     what a stable is; at three tiles against the lumber camp's two the two
     never read as the same building. */
  bld_stable:  {mesh:'building_lumbermill_blue.gltf',     tiles:3},
  bld_house_b: {mesh:'building_home_B_blue.gltf',         tiles:1},
  bld_marchkeep:{mesh:'building_tower_B_blue.gltf',       tiles:2},
  bld_relay:   {mesh:'building_watermill_blue.gltf',      tiles:2},
  bld_themehall:{mesh:'building_tavern_blue.gltf',        tiles:2},
  bld_wonder:  {mesh:'building_church_blue.gltf',         tiles:4},
  dec_well:    {mesh:'building_well_blue.gltf',           px:56},
  /* Walls run along one of the two tile axes, and in a fixed camera those are
     two different silhouettes, so each piece is baked once per axis. The hex
     pack's straight sections are flat panels, which is exactly what a square
     grid wants. */
  /* The panel is long in X and thin in Z, and with this camera three's X runs
     down-right on screen while its Z runs down-left -- the same two directions
     the tile grid's x and y do. So yaw 0 is a wall along tile x, yaw 90 one
     along tile y, and nothing in between is grid-aligned. */
  bld_wall_a:  {mesh:'wall_straight.gltf',      tiles:1, yaw:0},
  bld_wall_b:  {mesh:'wall_straight.gltf',      tiles:1, yaw:90},
  bld_gate_a:  {mesh:'wall_straight_gate.gltf', tiles:1, yaw:0},
  bld_gate_b:  {mesh:'wall_straight_gate.gltf', tiles:1, yaw:90},
};

const UNITS={
  /* KayKit's Adventurers pack: same rig as the mannequin, so the shared clip
     library still drives everything. Weapons, shields, helmets and capes are
     meshes inside each file -- `show` picks the ones this unit carries, and
     `teamMesh` keys one garment to the player colour, since keeping the pack's
     textures otherwise loses ownership entirely. */
  villager:{headScale:0.68, mesh:'kit_rogue.glb', keepMaterials:true, teamMesh:'Rogue_Body', show:[],
    weapon:'axe',
    states:[S.idle,S.walk,{name:'attack',clip:'Chopping',n:5},
            {name:'work',clip:'Chopping',n:5},{name:'mine',clip:'Pickaxing',n:5},
            {name:'build',clip:'Hammering',n:5},S.die]},
  militia:{headScale:0.6, mesh:'kit_knight.glb', keepMaterials:true, teamMesh:'Round_Shield',
    show:['1H_Sword','Round_Shield','Knight_Helmet'],
    states:[S.idle,S.walk,{name:'attack',clip:'Melee_1H_Attack_Slice_Diagonal',n:5},S.die]},
  spearman:{headScale:0.6, mesh:'kit_barbarian.glb', keepMaterials:true, teamMesh:'Barbarian_Body', show:['Barbarian_Hat'],
    weapon:'pike', wrot:[3.14159,0,0.55], shield:'kite',
    states:[S.idle,S.walk,{name:'attack',clip:'Melee_2H_Attack_Stab',n:5},S.die]},
  archer:{headScale:0.64, mesh:'kit_rogue_hooded.glb', keepMaterials:true, teamMesh:'Rogue_Cape',
    show:['2H_Crossbow','Rogue_Cape'],
    states:[{name:'idle',clip:'Ranged_Bow_Idle',n:2},{name:'walk',clip:'Running_HoldingBow',n:6},
            {name:'attack',clip:'Ranged_Bow_Draw',n:5},S.die]},
  skirmisher:{headScale:0.64, mesh:'kit_rogue.glb', keepMaterials:true, teamMesh:'Rogue_Body',
    show:['Throwable'],
    states:[S.idle,S.walk,{name:'attack',clip:'Throw',n:5},S.die]},
  pavise:{headScale:0.6, mesh:'kit_knight.glb', keepMaterials:true, teamMesh:'Rectangle_Shield',
    show:['1H_Sword','Rectangle_Shield','Knight_Helmet'],
    states:[S.idle,S.walk,{name:'attack',clip:'Melee_1H_Attack_Chop',n:5},S.die]},
  monk:{headScale:0.7, mesh:'kit_mage.glb', keepMaterials:true, teamMesh:'Mage_Cape',
    show:['2H_Staff','Mage_Cape'],
    states:[S.idle,S.walk,{name:'attack',clip:'Ranged_Magic_Shoot',n:5},S.die]},
  scout:{headScale:0.68, mesh:'kit_rogue.glb', keepMaterials:true, teamMesh:'Rogue_Cape',
    show:['Knife','Rogue_Cape'], mount:{col:0xa87c4c,dark:0x5a4228},
    states:[{name:'idle',clip:'Sit_Chair_Idle',n:2},{name:'walk',clip:'Sit_Chair_Idle',n:6},
            {name:'attack',clip:'Melee_1H_Attack_Slice_Diagonal',n:5},S.die]},
  knight:{headScale:0.64, mesh:'kit_knight.glb', keepMaterials:true, teamMesh:'Knight_Cape',
    show:['1H_Sword','Round_Shield','Knight_Helmet','Knight_Cape'],
    mount:{col:0x7a5636,dark:0x3f2c1c},
    states:[{name:'idle',clip:'Sit_Chair_Idle',n:2},{name:'walk',clip:'Sit_Chair_Idle',n:6},
            {name:'attack',clip:'Melee_1H_Attack_Slice_Diagonal',n:5},S.die]},
  windrider:{headScale:0.66, mesh:'kit_rogue_hooded.glb', keepMaterials:true, teamMesh:'Rogue_Cape',
    show:['2H_Crossbow','Rogue_Cape'], mount:{col:0xb08a58,dark:0x604830},
    states:[{name:'idle',clip:'Sit_Chair_Idle',n:2},{name:'walk',clip:'Sit_Chair_Idle',n:6},
            {name:'attack',clip:'Ranged_Bow_Draw',n:5},S.die]},
  cataphract:{headScale:0.64, mesh:'kit_knight.glb', keepMaterials:true, teamMesh:'Knight_Cape',
    show:['Spike_Shield','Knight_Helmet','Knight_Cape'], weapon:'spear',
    mount:{col:0x9a9aa4,dark:0x4c4c56},
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
    if(!/\.(glb|gltf|bin|png)$/.test(f))continue;
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

  /* --props: bake the building models into prop sheets the game anchors on the
     footprint diamond, the same path the houses already use. */
  if(process.argv[2]==='--props'){
    const PF=path.join(OUT,'props.json');
    const props=fs.existsSync(PF)?JSON.parse(fs.readFileSync(PF,'utf8')):{};
    /* `--props <name> [...]` bakes just those, so adding one asset does not
       rewrite the other forty-five PNGs. props.json is seeded from the file on
       disk, so the entries not baked survive. */
    const only=process.argv.slice(3);
    for(const [name,cfg] of Object.entries(PROPS)){
      if(only.length&&!only.includes(name))continue;
      const r=await page.evaluate(c=>window.__bakeProp(c),cfg);
      fs.writeFileSync(path.join(OUT,name+'.png'),Buffer.from(r.png.split(',')[1],'base64'));
      props[name]={ax:r.ax,ay:r.ay,w:r.w,h:r.h,frames:r.frames||1};
      console.log(name.padEnd(14), r.w+'x'+r.h, 'anchor', r.ax+','+r.ay);
    }
    fs.writeFileSync(PF,JSON.stringify(props,null,1));
    await br.close(); srv.close(); return;
  }

  /* --beasts: the wildlife, which has no skinned rig and bakes procedurally */
  if(process.argv[2]==='--beasts'){
    const MF=path.join(OUT,'units.json');
    const manifest=fs.existsSync(MF)?JSON.parse(fs.readFileSync(MF,'utf8')):{};
    for(const kind of ['sheep','cattle','boar','wolf']){
      const BZ={sheep:1.75,cattle:1.45,boar:1.55,wolf:1.60};
      const r=await page.evaluate(a=>window.__bakeBeast(a),{kind,yawOffset:180,zoom:BZ[kind]});
      fs.writeFileSync(path.join(OUT,kind+'.png'),Buffer.from(r.png.split(',')[1],'base64'));
      manifest[kind]={fw:r.fw,fh:r.fh,frames:r.frames,anchor:r.anchor,states:r.states};
      console.log(kind.padEnd(9),(r.png.length*0.75/1024|0)+'KB',r.frames+' frames');
    }
    fs.writeFileSync(MF,JSON.stringify(manifest,null,1));
    await br.close(); srv.close(); return;
  }

  /* --refs: reference sheets for image-to-3D, not sprites.
     Four square-on facings per unit at 768x1024 on a plain ground, which is the
     shape the 3D generators want. Feeding them our own model means whatever
     comes back is built on our proportions and our silhouette -- same height,
     same kit, same stance -- instead of the generator's idea of a spearman,
     which lands at a different scale and has to be fought back into the game.
     Written outside the repo: they are input to a tool, not shipped art. */
  if(process.argv[2]==='--refs'){
    const RD=process.env.REF_OUT||'/tmp/refs';
    fs.mkdirSync(RD,{recursive:true});
    const only=process.argv.slice(3);
    for(const [name,cfg] of Object.entries(UNITS)){
      if(only.length&&!only.includes(name))continue;
      const r=await page.evaluate(c=>window.__bake(c),{...cfg,animFiles:A,refViews:true});
      const dir=path.join(RD,name); fs.mkdirSync(dir,{recursive:true});
      for(const [view,dataUrl] of Object.entries(r.refViews))
        fs.writeFileSync(path.join(dir,view+'.png'),Buffer.from(dataUrl.split(',')[1],'base64'));
      console.log(name.padEnd(11), r.w+'x'+r.h, Object.keys(r.refViews).join(','));
    }
    await br.close(); srv.close(); return;
  }

  /* `bake.js a b c` bakes just those units; without arguments it bakes them all */
  const only=process.argv.slice(2).filter(a=>!a.startsWith('--'));
  /* a single-unit bake must not drop the other units out of the manifest */
  const MF=path.join(OUT,'units.json');
  const manifest=fs.existsSync(MF)?JSON.parse(fs.readFileSync(MF,'utf8')):{};
  for(const [name,cfg] of Object.entries(UNITS)){
    if(only.length&&!only.includes(name))continue;
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
