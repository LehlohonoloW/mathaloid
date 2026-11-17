import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import vm from "node:vm";

const rendererSource = await readFile(new URL("../js/world-renderer.js", import.meta.url), "utf8");
const worldSource = await readFile(new URL("../js/world.js", import.meta.url), "utf8");
const expeditionSource = await readFile(new URL("../js/expedition.js", import.meta.url), "utf8");
const context = vm.createContext({ Float32Array });
vm.runInContext(worldSource, context);
vm.runInContext(expeditionSource, context);
vm.runInContext(rendererSource.replace("global.AtlasRenderer={create,stations:STATIONS,ground};", "global.AtlasRenderer={create,stations:STATIONS,ground,Mesh,landscape,dynamic,regionalLandscape,regionalMotion,routes:ROUTES};"), context);
const R = context.AtlasRenderer, E = context.Expedition, ids = R.stations.map(s => s.id);
const scenes = [R.landscape(false), R.landscape(true)];
const digest = data => createHash("sha256").update(data).digest("hex");
const states = ids.flatMap(id => ["beginner", "standard", "advanced"].map(difficulty => {
  const values = E.sampleSolution(id, difficulty), model = E.mission(id, difficulty).model;
  return { time: 2, completed: ids, experiment: { id, difficulty, values, model, result: E.evaluate(id, values, difficulty), elapsed: 2 } };
}));

test("regional silhouettes fit the original budget at every difficulty and maximum garden size", () => {
  const totals = [];
  for (const [index, low] of [false, true].entries()) {
    const scene = scenes[index], maximumGarden = { completed: ids, beacon: R.stations[5], pulses: Array.from({length:8},(_,i)=>({x:i,z:28,t:.5})), experiment: { id: "garden", values: { length: 12, width: 12 } } };
    const triangles = Math.max(...[...states, maximumGarden].map(state => (scene.mesh.length + R.dynamic(state, low).length) / 27));
    assert(triangles < 22000, `${low ? "Canvas" : "WebGL"}: ${triangles} triangles`);
    assert.equal(Object.keys(scene.regionTriangles).length, 6);
    for (const value of scene.mesh) assert(Number.isFinite(value));
    totals.push({ low, staticTriangles: scene.mesh.length / 27, maximumTriangles: triangles, regions: scene.regionTriangles });
  }
  assert(scenes[1].mesh.length < scenes[0].mesh.length * .5);
  console.log("Renderer budgets", JSON.stringify(totals));
});

test("all 18 valid experiment outcomes render finite geometry and react to changed controls", () => {
  for (const low of [false, true]) {
    for (const state of states) {
      const experiment = state.experiment;
      assert(experiment.result.valid && experiment.result.success, `${experiment.id}:${experiment.difficulty} has a valid physical result`);
      const array = R.dynamic(state, low);
      assert(array.length > 0 && array.every(Number.isFinite));
      const control = E.mission(experiment.id, experiment.difficulty).controls.find(control => experiment.values[control.key] !== control.min);
      const values = { ...experiment.values, [control.key]: control.min };
      const result = E.evaluate(experiment.id, values, experiment.difficulty);
      assert(result.valid);
      const changed = R.dynamic({ ...state, experiment: { ...experiment, values, result } }, low);
      assert.notEqual(digest(new Uint8Array(array.buffer)), digest(new Uint8Array(changed.buffer)), `${experiment.id}:${experiment.difficulty} reacts to controls`);
    }
  }
});

test("regional landmarks introduce no collision changes", () => {
  assert.equal(digest(JSON.stringify(scenes[0].colliders)), "dac531537768a6c45392c6491a281016b6d0c47e208327c7025e974413b3974c");
  assert.equal(scenes[0].colliders.length, 81);
  assert.equal(scenes[1].colliders.length, 17);
});

const distanceToSegment = (x,z,a,b) => {
  const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));
  return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);
};

test("new tall scenery clears walking routes, travel spawns, and station workspaces", () => {
  for (const low of [false, true]) {
    const mesh = new R.Mesh(); R.regionalLandscape(mesh, low);
    for(let i=0;i<mesh.data.length;i+=9) {
      const [x,y,z]=mesh.data.slice(i,i+3);
      if (y-R.ground(x,z)<.45) continue;
      for(let j=1;j<R.routes.length;j++) assert(distanceToSegment(x,z,R.routes[j-1],R.routes[j])>1.7, `route ${j}: ${x},${z}`);
      assert(Math.hypot(x,z-28)>5, "initial spawn clearance");
      for(const s of R.stations) {
        assert(Math.hypot(x-s.x-7,z-s.z-7)>3.5, `${s.id} travel spawn clearance`);
        assert(Math.hypot(x-s.x,z-s.z)>(s.id==="bridge"?7:10), `${s.id} workspace clearance: ${x},${z}`);
      }
    }
  }
});

test("turbine reacts only to restored energy and remains still when time is frozen", () => {
  const geometry = state => {const mesh=new R.Mesh();R.regionalMotion(mesh,state);return mesh.data;};
  assert.deepEqual(geometry({time:1}),geometry({time:20}));
  assert.notDeepEqual(geometry({time:1,completed:["energy"]}),geometry({time:20,completed:["energy"]}));
  assert.deepEqual(geometry({time:0,completed:["energy"]}),geometry({time:0,completed:[]}));
});

const subtract=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function blocksSegment(start,end,a,b,c) {
  const ray=subtract(end,start),edge1=subtract(b,a),edge2=subtract(c,a),p=cross(ray,edge2),det=dot(edge1,p);
  if(Math.abs(det)<1e-8)return false;
  const offset=subtract(start,a),u=dot(offset,p)/det;if(u<0||u>1)return false;
  const q=cross(offset,edge1),v=dot(ray,q)/det;if(v<0||u+v>1)return false;
  const t=dot(edge2,q)/det;return t>.001&&t<.999;
}

test("regional scenery preserves every laboratory camera sightline", () => {
  for(const low of [false,true]) {
    const mesh=new R.Mesh();R.regionalLandscape(mesh,low);R.regionalMotion(mesh,{completed:ids,time:2});
    for(const s of R.stations) {
      const projectile=s.id==="projectile",y=R.ground(s.x,s.z),cam=[s.x+(projectile?30:13),y+(projectile?17:11),s.z+(projectile?32:20)];
      const targets=[[-4,1,-4],[0,2,-4],[4,3,-4]];
      if(projectile)targets.push([24,1,-4],[12,7,-4]);
      for(const [dx,dy,dz] of targets)for(let i=0;i<mesh.data.length;i+=27)assert(!blocksSegment(cam,[s.x+dx,y+dy,s.z+dz],mesh.data.slice(i,i+3),mesh.data.slice(i+9,i+12),mesh.data.slice(i+18,i+21)), `${s.id} camera obscured by triangle ${i/27}`);
    }
  }
});

test("real renderer smoke: WebGL, all labs, Canvas, reduced motion and context recovery", { skip: !process.env.ATLAS_PLAYWRIGHT_MODULE || (typeof Bun !== "undefined" && process.platform === "win32") }, async () => {
  const { chromium } = createRequire(import.meta.url)(process.env.ATLAS_PLAYWRIGHT_MODULE);
  const browser = await chromium.launch({ headless:true, executablePath:process.env.ATLAS_CHROMIUM || undefined, args:["--enable-unsafe-swiftshader"] });
  try {
    const page=await browser.newPage({viewport:{width:1280,height:800}}), errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    page.on("console",message=>{if(message.type()==="error")errors.push(message.text());});
    await page.setContent('<canvas id="world" style="width:1280px;height:800px"></canvas>');
    await page.addScriptTag({content:worldSource});await page.addScriptTag({content:rendererSource});
    const glResult=await page.evaluate(async states=>{
      const canvas=document.getElementById("world"),renderer=AtlasRenderer.create(canvas,{reduced:true});
      renderer.resize(1280,800,1);
      const cam={x:0,y:World3D.terrainHeight(0,28)+2.4,z:28,yaw:0};
      renderer.render(cam,{completed:["energy"],time:1});
      const gl=canvas.getContext("webgl"),first=new Uint8Array(1280*800*4);gl.readPixels(0,0,1280,800,gl.RGBA,gl.UNSIGNED_BYTE,first);
      renderer.render(cam,{completed:["energy"],time:20});
      const second=new Uint8Array(first.length);gl.readPixels(0,0,1280,800,gl.RGBA,gl.UNSIGNED_BYTE,second);
      const frozen=first.every((v,i)=>v===second[i]),varied=first.some((v,i)=>i%4===0&&v!==first[0]);
      const labs=[];
      for(const state of states){const s=AtlasRenderer.stations.find(s=>s.id===state.experiment.id),projectile=s.id==="projectile";renderer.render({x:s.x+(projectile?30:13),z:s.z+(projectile?32:20),y:World3D.terrainHeight(s.x,s.z)+(projectile?17:11),yaw:-.55,pitch:-.3},state);labs.push(renderer.stats());}
      const extension=gl.getExtension("WEBGL_lose_context");let recovered=false;
      if(extension){extension.loseContext();await new Promise(resolve=>setTimeout(resolve,100));extension.restoreContext();await new Promise(resolve=>setTimeout(resolve,250));renderer.render(cam,{});recovered=!renderer.stats().contextLost&&renderer.stats().frames===21;}
      const result={frozen,varied,labs,recovered,error:gl.getError()};renderer.dispose();return result;
    },JSON.parse(JSON.stringify(states)));
    assert(glResult.frozen);assert(glResult.varied);assert(glResult.recovered);assert.equal(glResult.error,0);
    assert(glResult.labs.every(s=>s.renderer==="WebGL"&&s.triangles<22000&&s.drawCalls===3));
    await page.setContent('<canvas id="world"></canvas>');
    const canvasResult=await page.evaluate(states=>{
      const canvas=document.getElementById("world"),renderer=AtlasRenderer.create(canvas,{forceCanvas:true,reduced:true});renderer.resize(960,600,1);
      const labs=[];
      for(const state of states){const s=AtlasRenderer.stations.find(s=>s.id===state.experiment.id),projectile=s.id==="projectile";renderer.render({x:s.x+(projectile?30:13),z:s.z+(projectile?32:20),y:World3D.terrainHeight(s.x,s.z)+(projectile?17:11),yaw:-.55,pitch:-.3},state);labs.push(renderer.stats());}
      const pixels=canvas.getContext("2d").getImageData(0,0,960,600).data,varied=pixels.some((v,i)=>i%4===0&&v!==pixels[0]);
      renderer.dispose();return {labs,varied};
    },JSON.parse(JSON.stringify(states)));
    assert(canvasResult.varied);assert(canvasResult.labs.every(s=>s.renderer==="Canvas 2D"&&s.triangles>0&&s.frames>0));
    assert.deepEqual(errors,[]);
    console.log("Real render smoke",JSON.stringify({webglMaximum:Math.max(...glResult.labs.map(s=>s.triangles)),webglMeanMs:glResult.labs.reduce((n,s)=>n+s.renderMs,0)/18,canvasMeanMs:canvasResult.labs.reduce((n,s)=>n+s.renderMs,0)/18,contextRecovery:glResult.recovered}));
  } finally {await browser.close();}
});
