#!/usr/bin/env node
/* Drive Meshy from the command line.
   This cannot run inside a Claude Code cloud session: the container's network
   policy answers 403 to CONNECT for api.meshy.ai, so every call dies in the
   proxy before it reaches Meshy. Run it on your own machine, where it works.

     export MESHY_API_KEY=msy_...
     node tools/meshy/generate.mjs text  knight "heavy cavalry on a barded bay..."
     node tools/meshy/generate.mjs image knight tools/meshy/refs/knight_front.png

   Text-to-3D runs preview then refine; image-to-3D is one pass. Either way the
   finished .glb lands in tools/glb/ under the name you gave, which is where
   bake.js looks -- so the next step is:

     node tools/bake.js knight            # or --props for a building
     python3 tools/quantise.py && python3 tools/embed_assets.py
*/
import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {basename} from 'node:path';

const KEY=process.env.MESHY_API_KEY;
if(!KEY){ console.error('set MESHY_API_KEY'); process.exit(1); }
const API='https://api.meshy.ai/openapi';
const H={Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'};

/* Every prompt carries these. They are what keeps a generated unit the same
   size and the same idiom as the roster it has to stand next to; without them
   you get a realistic 7-head figure in a game of chunky ones. */
const STYLE='low-poly stylised game character, flat untextured colour, no PBR '+
  'detail, A-pose with arms slightly out from the body, feet together, facing '+
  'forward, chunky proportions, head about one fifth of total height, thick '+
  'limbs, single character, plain background, no base, no plinth, no scenery';

async function call(path,body){
  const r=await fetch(API+path,{method:'POST',headers:H,body:JSON.stringify(body)});
  const t=await r.text();
  if(!r.ok)throw new Error(`${r.status} ${path}: ${t.slice(0,400)}`);
  return JSON.parse(t);
}
async function poll(path,id,label){
  for(let i=0;;i++){
    const r=await fetch(`${API}${path}/${id}`,{headers:H});
    if(!r.ok)throw new Error(`${r.status} polling ${id}: ${(await r.text()).slice(0,300)}`);
    const j=await r.json();
    if(j.status==='SUCCEEDED')return j;
    if(j.status==='FAILED'||j.status==='CANCELED')
      throw new Error(`${label} ${j.status}: ${JSON.stringify(j.task_error||{})}`);
    process.stdout.write(`\r${label} ${j.status} ${j.progress??0}%   `);
    await new Promise(s=>setTimeout(s,5000));
  }
}
async function save(url,name){
  await mkdir('tools/glb',{recursive:true});
  const r=await fetch(url);
  if(!r.ok)throw new Error(`download ${r.status}`);
  const out=`tools/glb/${name}.glb`;
  await writeFile(out,Buffer.from(await r.arrayBuffer()));
  console.log(`\n${out}`);
  return out;
}

const [mode,name,...rest]=process.argv.slice(2);
if(!mode||!name){ console.error('usage: generate.mjs <text|image> <name> <prompt|imagePath...>'); process.exit(1); }

if(mode==='text'){
  const prompt=rest.join(' ');
  if(!prompt){ console.error('need a prompt'); process.exit(1); }
  const pv=await call('/v2/text-to-3d',
    {mode:'preview',prompt:`${prompt}. ${STYLE}`,art_style:'sculpture',should_remesh:true,topology:'triangle',target_polycount:6000});
  await poll('/v2/text-to-3d',pv.result,'preview');
  const rf=await call('/v2/text-to-3d',{mode:'refine',preview_task_id:pv.result});
  const done=await poll('/v2/text-to-3d',rf.result,'refine');
  await save(done.model_urls.glb,name);
} else if(mode==='image'){
  /* Meshy takes data URIs, which saves standing up a public URL for a local
     file -- the whole point of rendering these from our own models. */
  const uris=await Promise.all(rest.map(async f=>
    `data:image/png;base64,${(await readFile(f)).toString('base64')}`));
  if(!uris.length){ console.error('need at least one image'); process.exit(1); }
  const body=uris.length>1
    ? {image_urls:uris,should_remesh:true,should_texture:true,topology:'triangle',target_polycount:6000}
    : {image_url:uris[0],should_remesh:true,should_texture:true,topology:'triangle',target_polycount:6000};
  const t=await call(uris.length>1?'/v1/multi-image-to-3d':'/v1/image-to-3d',body);
  const done=await poll(uris.length>1?'/v1/multi-image-to-3d':'/v1/image-to-3d',t.result,basename(name));
  await save(done.model_urls.glb,name);
} else { console.error(`unknown mode ${mode}`); process.exit(1); }
