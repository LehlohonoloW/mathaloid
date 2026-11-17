(function (global) {
  "use strict";
  const TAU = Math.PI * 2;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const ground = (x, z) => global.World3D ? global.World3D.terrainHeight(x, z) : 0.55 * Math.sin(x * 0.09 + 0.3) + 0.5 * Math.cos(z * 0.08 - 0.4) + 0.22 * Math.sin((x + z) * 0.05);
  const rgb = (hex) => { const n = parseInt(hex.replace("#", ""), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  const C = Object.fromEntries(Object.entries({grass:"#6c9874",lightGrass:"#86ab81",darkGrass:"#577e63",water:"#4caaa7",sand:"#d2c7a0",stone:"#a0bcb3",white:"#e4e5ca",bark:"#77654b",leaf:"#467c68",mint:"#82bba1",pine:"#315e57",brass:"#e1ac54",dark:"#314f53",cyan:"#76d8ce",pink:"#d8aaa2",orange:"#d58653",violet:"#9b9bcc",soil:"#6f6650"}).map(([k,v]) => [k,rgb(v)]));
  class Mesh {
    constructor() { this.data = []; }
    tri(a, b, c, color) {
      const u = b.map((n,i)=>n-a[i]), v = c.map((n,i)=>n-a[i]);
      let n = [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
      const len = Math.hypot(...n) || 1; n = n.map(x=>x/len);
      for (const p of [a,b,c]) this.data.push(...p,...n,...color);
    }
    quad(a,b,c,d,color) { this.tri(a,b,c,color); this.tri(a,c,d,color); }
    box(x,y,z,w,h,d,color,yaw=0) {
      const sy = Math.sin(yaw), cy = Math.cos(yaw);
      const p = (a,b,c) => [x+a*cy+c*sy,y+b,z-a*sy+c*cy];
      const a=p(-w/2,0,-d/2),b=p(w/2,0,-d/2),c=p(w/2,0,d/2),e=p(-w/2,0,d/2);
      const f=p(-w/2,h,-d/2),g=p(w/2,h,-d/2),i=p(w/2,h,d/2),j=p(-w/2,h,d/2);
      this.quad(f,j,i,g,color); this.quad(a,b,c,e,color); this.quad(a,f,g,b,color); this.quad(b,g,i,c,color); this.quad(c,i,j,e,color); this.quad(e,j,f,a,color);
    }
    cylinder(x,y,z,r,h,color,sides=10,topRadius=r) {
      for(let k=0;k<sides;k++) {
        const a=k/sides*TAU,b=(k+1)/sides*TAU;
        const p=[x+Math.cos(a)*r,y,z+Math.sin(a)*r],q=[x+Math.cos(b)*r,y,z+Math.sin(b)*r];
        const u=[x+Math.cos(a)*topRadius,y+h,z+Math.sin(a)*topRadius],v=[x+Math.cos(b)*topRadius,y+h,z+Math.sin(b)*topRadius];
        this.quad(p,u,v,q,color); if(topRadius>0)this.tri([x,y+h,z],v,u,color);
      }
    }
    sphere(x,y,z,r,color,sides=10,rings=5,stretch=[1,1,1]) {
      const p=(a,b)=>[x+Math.sin(a)*Math.cos(b)*r*stretch[0],y+Math.cos(a)*r*stretch[1],z+Math.sin(a)*Math.sin(b)*r*stretch[2]];
      for(let i=0;i<rings;i++)for(let j=0;j<sides;j++)this.quad(p(i/rings*Math.PI,j/sides*TAU),p(i/rings*Math.PI,(j+1)/sides*TAU),p((i+1)/rings*Math.PI,(j+1)/sides*TAU),p((i+1)/rings*Math.PI,j/sides*TAU),color);
    }
    beam(a,b,width,color,thickness=width) {
      const v=b.map((x,i)=>x-a[i]), len=Math.hypot(...v)||1, d=v.map(x=>x/len);
      const r=Math.hypot(d[0],d[2])>0.01?[-d[2],0,d[0]]:[1,0,0], rl=Math.hypot(...r);
      const u=r.map(x=>x/rl*width/2), n=[d[1]*u[2]-d[2]*u[1],d[2]*u[0]-d[0]*u[2],d[0]*u[1]-d[1]*u[0]].map(v=>v*thickness/width);
      const p=(base,s,t)=>base.map((x,i)=>x+u[i]*s+n[i]*t);
      const aa=p(a,-1,-1),ab=p(a,1,-1),ac=p(a,1,1),ad=p(a,-1,1),ba=p(b,-1,-1),bb=p(b,1,-1),bc=p(b,1,1),bd=p(b,-1,1);
      this.quad(aa,ba,bb,ab,color);this.quad(ab,bb,bc,ac,color);this.quad(ac,bc,bd,ad,color);this.quad(ad,bd,ba,aa,color);this.quad(ba,bd,bc,bb,color);
    }
    disk(x,z,r,color,y=ground(x,z)+0.055,sides=14) {
      for(let i=0;i<sides;i++)this.tri([x,y,z],[x+Math.cos(i/sides*TAU)*r,y,z+Math.sin(i/sides*TAU)*r],[x+Math.cos((i+1)/sides*TAU)*r,y,z+Math.sin((i+1)/sides*TAU)*r],color);
    }
    ring(x,y,z,r,width,color,sides=24) {
      for(let i=0;i<sides;i++) {
        const a=i/sides*TAU,b=(i+1)/sides*TAU;
        this.quad([x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(a)*(r+width),y,z+Math.sin(a)*(r+width)],[x+Math.cos(b)*(r+width),y,z+Math.sin(b)*(r+width)],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],color);
      }
    }
    rock(x,y,z,w,h,d,color,yaw=0) {
      const outline=[[-.5,-.32],[-.22,-.5],[.35,-.43],[.5,.12],[.23,.5],[-.4,.38]],heights=[.72,.94,1,.85,.66,.78],sy=Math.sin(yaw),cy=Math.cos(yaw);
      const point=(p,scale,yy)=>[x+p[0]*w*scale*cy+p[1]*d*scale*sy,yy,z-p[0]*w*scale*sy+p[1]*d*scale*cy];
      for(let i=0;i<outline.length;i++){
        const j=(i+1)%outline.length,a=point(outline[i],1,y),b=point(outline[j],1,y),c=point(outline[j],.76,y+h*heights[j]),e=point(outline[i],.76,y+h*heights[i]);
        this.quad(a,b,c,e,color);this.tri(e,c,[x+w*.06,y+h,z-d*.04],color);
      }
    }
    array() { return new Float32Array(this.data); }
  }
  const STATIONS = [
    {id:"bridge",x:-30,z:10,color:"#dfac66"}, {id:"projectile",x:35,z:-28,color:"#df956c"},
    {id:"balance",x:-45,z:-45,color:"#96baba"}, {id:"energy",x:60,z:35,color:"#e1bb64"},
    {id:"waves",x:10,z:-70,color:"#91a6d0"}, {id:"garden",x:-65,z:55,color:"#90c19e"}
  ];
  const river = (x,z) => Math.abs(x+30)<5 && z>-35 && z<45;
  function seeded(seed) { let n=seed; return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;}; }
  const ROUTES=[[0,24],[0,8],[-22,10],[-43,10],[-45,-35],[-35,-56],[10,-62],[35,-36],[44,-10],[60,27],[38,56],[-12,67],[-65,63],[-65,33],[-43,10]];
  function regionalColor(x,z) {
    let color=C.grass;
    for(const [cx,cz,rx,rz,tone,strength] of [[-52,-52,30,22,C.sand,.64],[34,-40,27,19,C.stone,.5],[66,26,31,23,C.lightGrass,.48],[-73,51,23,24,C.darkGrass,.42],[10,-87,39,17,C.sand,.46]]){
      const edge=clamp(1-Math.hypot((x-cx)/rx,(z-cz)/rz),0,1),mix=edge*edge*(3-2*edge)*strength;
      color=color.map((v,i)=>v+(tone[i]-v)*mix);
    }
    return color;
  }
  function regionalLandscape(m,low=false) {
    const counts={},part=(id,build)=>{const start=m.data.length;build();counts[id]=(m.data.length-start)/27;};
    part("quarry",()=>{
      for(const [x,z,w,h,d,yaw] of [[-65,-62,20,6,10,-.2],[-49,-66,15,4.8,9,.14],[-73,-44,12,4.2,10,.35]]){
        const y=ground(x,z)-.15;
        for(let layer=0;layer<3;layer++)m.rock(x+layer*.5,y+layer*h/3,z-layer*.3,w-layer*2,h/3+.3,d-layer,layer===1?C.sand:C.stone,yaw);
        if(!low)for(let i=0;i<3;i++)m.rock(x+w*.35+i*1.1,ground(x+w*.35+i*1.1,z+6),z+6,1.4,.65,1.1,C.sand,i*.4);
      }
      m.beam([-62,ground(-62,-53)+.15,-53],[-53,ground(-53,-55)+.15,-55],.18,C.dark);
      m.beam([-62,ground(-62,-53)+.15,-52],[-53,ground(-53,-55)+.15,-54],.18,C.dark);
      m.box(-60,ground(-60,-53.5)+.2,-53.5,2,.6,1.3,C.bark,-.22);
    });
    part("ridge",()=>{
      for(const [x,z,w,h,d,yaw] of [[29,-56,12,8,7,-.3],[35,-64,9,5.5,6,.25],[48,-55,8,3.4,5,.5]]){
        m.rock(x,ground(x,z)-.2,z,w,h,d,C.stone,yaw);
        m.rock(x+.3,ground(x,z)+h*.72,z-.3,w*.65,h*.28,d*.65,C.white,yaw);
      }
      const x=20,z=-33,y=ground(x,z);
      m.cylinder(x,y,z,.27,9,C.dark,6,.16);
      for(let i=0;i<4;i++)m.cylinder(x,y+1+i*1.6,z,.29,.16,C.brass,6);
      m.beam([x-2,y+7.2,z],[x+2,y+7.2,z],.16,C.white);
      m.tri([x,y+9,z],[x+3,y+8.2,z],[x,y+7.8,z],C.orange);
      for(const dx of [-2,2])m.beam([x,y+5,z],[x+dx,y,z],.08,C.dark);
    });
    part("lake",()=>{
      const x=12,z=-119,rx=33,rz=18,y=1.45,sides=low?18:32;
      for(let i=0;i<sides;i++){
        const a=i/sides*TAU,b=(i+1)/sides*TAU,p=[x+Math.cos(a)*rx,y,z+Math.sin(a)*rz],q=[x+Math.cos(b)*rx,y,z+Math.sin(b)*rz];
        m.tri([x,y,z],p,q,C.water);
        m.quad(p,q,[x+Math.cos(b)*(rx+3),y+.12,z+Math.sin(b)*(rz+3)],[x+Math.cos(a)*(rx+3),y+.12,z+Math.sin(a)*(rz+3)],C.sand);
      }
      for(const [xx,zz] of [[-13,-101],[0,-99],[29,-99],[39,-105]]){
        for(let i=0;i<(low?2:4);i++){
          const px=xx+(i%3)*.6,pz=zz+Math.floor(i/3)*.7,py=Math.max(y+.1,ground(px,pz)),h=1.1+(i%3)*.3;
          m.beam([px,py,pz],[px+.16,py+h,pz+.12],.055,C.leaf);
          m.cylinder(px+.16,py+h-.28,pz+.12,.09,.32,C.bark,4);
        }
      }
      for(const [xx,zz] of [[-1,-109],[14,-112],[29,-116]]){
        m.cylinder(xx,y+.02,zz,.65,.24,C.white,low?6:8,.45);
        m.cylinder(xx,y+.26,zz,.1,1.3,C.dark,5);
        m.sphere(xx,y+1.6,zz,.24,C.violet,5,2);
      }
      m.rock(-21,ground(-21,-94),-94,9,2.4,5,C.stone,-.25);
      m.rock(41,ground(41,-97),-97,7,1.8,5,C.stone,.4);
      if(!low)for(let i=0;i<3;i++)m.beam([-1+i*6,y+.035,-104-i*2],[2+i*6,y+.035,-104-i*2],.05,C.cyan);
    });
    part("garden",()=>{
      for(const z of [43,58]){
        const x=-82,y=ground(x,z);
        for(const dx of [-4,4])m.beam([x+dx,ground(x+dx,z),z],[x+dx,y+4.3,z],.22,C.bark);
        for(const yy of [2.6,3.5,4.3])m.beam([x-4,y+yy,z],[x+4,y+yy,z],.15,C.bark);
        for(const dx of [-2,0,2])m.beam([x+dx,y+1.5,z],[x+dx,y+4.3,z],.09,C.brass);
        for(const dx of [-3,3]){
          m.box(x+dx,y,z,1.2,.3,2,C.sand);
          for(let i=0;i<(low?2:4);i++)m.sphere(x+dx+Math.sin(i)*.3,y+1+i*.65,z,.45,i%2?C.mint:C.leaf,5,2,[1,.7,.45]);
        }
      }
      for(const z of [47,52,57]){
        m.box(-91,ground(-91,z),z,4,.25,2.5,C.bark);m.box(-91,ground(-91,z)+.25,z,3.7,.04,2.2,C.soil);
        for(let i=0;i<(low?2:4);i++)m.cylinder(-92+i*.65,ground(-91,z)+.3,z,.3,.65,C.mint,5,0);
      }
    });
    part("highland",()=>{
      for(let i=0;i<3;i++){
        const x=69+i*1.5,z=17-i*3,y=ground(x,z);
        m.rock(x,y-.1,z,15-i*2,1.3+i*.6,7,C.stone,-.15);
        m.box(x,y+1+i*.5,z,11-i*2,.12,4,C.lightGrass,-.15);
      }
      const x=61,z=8,y=ground(x,z);
      m.cylinder(x,y,z,1.7,.35,C.stone,8);
      m.cylinder(x,y+.35,z,.48,11.7,C.white,8,.22);
      m.box(x,y+11.5,z,1.4,1,2.2,C.dark);
      if(!low)for(const x of [83,86,89])m.rock(x,ground(x,32),32,1.3,.8,1,C.white,.3);
    });
    part("crossing",()=>{
      for(const x of [-41,-20])for(const z of [5.8,14.2]){
        const y=ground(x,z);
        m.box(x,y,z,2.2,.4,1.1,C.stone);
        m.cylinder(x,y+.4,z,.22,1.35,C.white,6);
        m.cylinder(x,y+1.65,z,.34,.16,C.brass,6);
        const end=x<-30?x+2:x+4;
        m.beam([x,y+1.15,z],[end,ground(end,z)+1.15,z],.12,C.bark);
      }
    });
    return counts;
  }
  function regionalMotion(m,state) {
    const x=61,z=8,y=ground(x,z)+12,time=(state.completed||[]).includes("energy")?(state.time||0)*.35:0;
    m.sphere(x,y,z+1.25,.45,C.brass,6,2);
    for(let i=0;i<3;i++){
      const a=i/3*TAU+time,point=r=>[x+Math.sin(a)*r,y+Math.cos(a)*r,z+1.4];
      m.beam(point(.35),point(4.4),.38,C.white,.12);
      m.beam(point(3.8),point(4.4),.4,C.brass,.13);
    }
  }
  function landscape(low=false) {
    const m=new Mesh(), random=seeded(4417), colliders=[];
    const size=low?16:5.6;
    for(let x=-112;x<112;x+=size)for(let z=-112;z<112;z+=size) {
      const points=[[x,ground(x,z),z],[x+size,ground(x+size,z),z],[x+size,ground(x+size,z+size),z+size],[x,ground(x,z+size),z+size]];
      const tone=.99+.035*Math.sin(x*.035)*Math.cos(z*.025);
      m.quad(...points,regionalColor(x+size/2,z+size/2).map(v=>v*tone));
    }
    const terrainLength=m.data.length;
    for(let z=-35;z<45;z+=2) {
      m.quad([-35,ground(-35,z)+.09,z],[-25,ground(-25,z)+.09,z],[-25,ground(-25,z+2)+.09,z+2],[-35,ground(-35,z+2)+.09,z+2],C.water);
      for(const x of [-36,-24])m.box(x,ground(x,z)-.02,z+1,1,.15,2,C.sand);
    }
    const routes=ROUTES;
    for(let i=1;i<routes.length;i++) {
      const a=routes[i-1],b=routes[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len*1.25,nz=dx/len*1.25;
      for(let j=0;j<len;j+=2) {
        const p=[a[0]+dx*j/len,a[1]+dz*j/len],q=[a[0]+dx*Math.min(j+2,len)/len,a[1]+dz*Math.min(j+2,len)/len];
        if(river(p[0],p[1]))continue;
        m.quad([p[0]+nx,ground(p[0]+nx,p[1]+nz)+.055,p[1]+nz],[q[0]+nx,ground(q[0]+nx,q[1]+nz)+.055,q[1]+nz],[q[0]-nx,ground(q[0]-nx,q[1]-nz)+.055,q[1]-nz],[p[0]-nx,ground(p[0]-nx,p[1]-nz)+.055,p[1]-nz],C.sand);
      }
    }
    const floorLength=m.data.length;
    for(let i=0;i<(low?18:88);i++) {
      const x=(random()-.5)*206,z=(random()-.5)*206;
      if(river(x,z)||Math.hypot(x,z)<17||STATIONS.some(s=>Math.hypot(s.x-x,s.z-z)<12)||routes.some(p=>Math.hypot(p[0]-x,p[1]-z)<6))continue;
      const y=ground(x,z),h=3+random()*4;
      m.disk(x+.6,z+.5,1.7,C.darkGrass);m.cylinder(x,y,z,.25,h*.58,C.bark,5);
      if(random()<.45){m.cylinder(x,y+h*.35,z,1.9,h*.9,C.pine,7,0);m.cylinder(x,y+h*.62,z,1.4,h*.75,C.leaf,7,0);}
      else {m.sphere(x,y+h*.8,z,2.1,C.leaf,low?5:7,low?2:3,[1,1.2,1]);m.sphere(x+.9,y+h,z-.3,1.6,C.mint,low?5:7,low?2:3);}
      colliders.push({x,z,r:.55});
    }
    for(let i=0;i<(low?12:30);i++) {
      const x=(random()-.5)*204,z=(random()-.5)*204;
      if(river(x,z)||STATIONS.some(s=>Math.hypot(s.x-x,s.z-z)<10)||Math.hypot(x,z)<15)continue;
      m.sphere(x,ground(x,z)+.3,z,.6+random()*.8,C.stone,6,2,[1.3,.8,1]);
    }
    for(let i=0;i<(low?12:50);i++) {
      const x=(random()-.5)*190,z=(random()-.5)*190;if(river(x,z))continue;
      m.cylinder(x,ground(x,z),z,.05,.45,C.leaf,3);m.sphere(x,ground(x,z)+.47,z,.16,i%3===0?C.pink:C.brass,4,2);
    }
    for(let i=0;i<(low?20:34);i++) {
      const a=i/(low?20:34)*TAU,r=170+random()*45,x=Math.cos(a)*r,z=Math.sin(a)*r;
      const h=15+random()*34;m.cylinder(x,-4,z,13+random()*13,h,i%2===0?C.stone:C.mint,7,0);
      if(h>30)m.cylinder(x,-4+h*.72,z,6,h*.28,C.white,7,0);
    }
    const hubY=ground(0,-4);
    m.ring(0,hubY+.12,-4,7.8,1,C.white);
    for(let i=0;i<8;i++) {
      const a=i/8*TAU,x=Math.cos(a)*7.8,z=-4+Math.sin(a)*7.8;
      if(z>1)continue;
      m.cylinder(x,ground(x,z),z,.5,6.5,C.white,8);m.cylinder(x,ground(x,z)+6.4,z,.8,.32,C.brass,8);
    }
    for(let i=0;i<16;i++) {
      const a=i/16*TAU,b=(i+1)/16*TAU;
      m.beam([Math.cos(a)*7.8,hubY+6.7,-4+Math.sin(a)*7.8],[Math.cos(b)*7.8,hubY+6.7,-4+Math.sin(b)*7.8],.45,C.white);
      m.beam([Math.cos(a)*7.8,hubY+6.7,-4+Math.sin(a)*7.8],[Math.cos(a)*2.5,hubY+10,-4+Math.sin(a)*2.5],.18,C.brass);
    }
    m.cylinder(0,hubY+9.8,-4,2.8,.35,C.brass,16);m.sphere(0,hubY+10.2,-4,2.5,C.cyan,12,4,[1,.7,1]);
    m.cylinder(0,hubY,-4,1.6,.4,C.white,12);m.sphere(0,hubY+3.4,-4,1.3,C.brass,6,3);
    for(const s of STATIONS) {
      const y=ground(s.x,s.z),col=rgb(s.color);
      if(s.id!=="bridge")m.ring(s.x,y+.11,s.z,7,.5,col);
      m.cylinder(s.x+5,y,s.z+4,.22,3.7,C.dark,6);m.box(s.x+5,y+2.5,s.z+4,2.1,1.2,.14,col);
      if(s.id==="projectile") {
        m.cylinder(s.x,y,s.z-4,2.4,.3,C.white,12);m.box(s.x,y+.3,s.z-4,2,.8,1.6,C.dark);
      } else if(s.id==="balance") {
        m.cylinder(s.x,y,s.z-3,.9,3.4,C.white,7,.4);m.sphere(s.x,y+3.4,s.z-3,.45,C.brass,8,3);
      } else if(s.id==="energy") {
        const z=s.z-5;
        m.cylinder(s.x+10,ground(s.x+10,z),z,.18,5,C.brass,6);m.box(s.x+10,ground(s.x+10,z)+4,z,.3,1,3,C.dark);
      } else if(s.id==="waves") {
        m.cylinder(s.x,y,s.z-4,4.1,.35,C.white,16);m.disk(s.x,s.z-4,3.6,C.water,y+.37,24);
        for(const x of [s.x-4.5,s.x+4.5]){m.cylinder(x,y,s.z-4,.5,5,C.dark,8);m.sphere(x,y+5,s.z-4,.8,C.violet,8,3);}
      } else if(s.id==="garden") {
        for(let x=0;x<12;x++)for(let z=0;z<12;z++){
          const xx=s.x+x*.6-3.3,zz=s.z-z*.6-3;
          m.quad([xx-.27,y+.1,zz-.27],[xx+.27,y+.1,zz-.27],[xx+.27,y+.1,zz+.27],[xx-.27,y+.1,zz+.27],C.soil);
        }
        for(const x of [s.x-4,s.x+4])m.cylinder(x,y,s.z-6,.18,4,C.white,6);
        m.beam([s.x-4,y+4,s.z-6],[s.x+4,y+4,s.z-6],.23,C.brass);
      } else if(s.id==="bridge") {
        for(const x of [-36,-24])for(const z of [7.5,12.5])m.cylinder(x,ground(x,z),z,.32,2.5,C.white,7);
        m.box(-38,ground(-38,10)+.04,10,4,.13,5,C.sand);m.box(-22,ground(-22,10)+.04,10,4,.13,5,C.sand);
      }
    }
    const regionTriangles=regionalLandscape(m,low);
    return {mesh:m.array(),colliders,terrainLength,floorLength,regionTriangles};
  }
  function dynamic(state,low=false) {
    const m=new Mesh(),done=new Set(state.completed||[]),experiment=state.experiment||null,time=state.time||0;
    const values=experiment?experiment.values||{}:{},metrics=experiment?{...experiment.model,...(experiment.result?experiment.result.metrics:{})}:{};
    for(const s of STATIONS) {
      const y=ground(s.x,s.z),active=experiment&&experiment.id===s.id,col=rgb(s.color),complete=done.has(s.id);
      if(complete)m.ring(s.x,y+.13,s.z,6.2,.18,C.brass,24);
      if(s.id==="bridge") {
        const deck=complete?1:(active?clamp((values.length||0)/(metrics.required||10),0,1):.05);
        for(let i=0;i<12*deck;i++){const x=-35.5+i;m.box(x,ground(x,10)+.21,10,.96,.18,4.5,C.white);}
        if(complete)for(const z of [7.8,12.2])m.beam([-36,ground(-36,z)+1.6,z],[-24,ground(-24,z)+1.6,z],.14,C.brass);
        if(active){const span=metrics.span||6,rise=metrics.rise||8,k=6/Math.max(span,rise),a=[-38,y+.5,6],b=[-38+span*k,y+.5,6],c=[-38+span*k,y+.5+rise*k,6],ratio=(values.length||0)/(metrics.required||Math.hypot(span,rise)),brace=a.map((v,i)=>v+(c[i]-v)*ratio);m.beam(a,b,.13,C.brass);m.beam(b,c,.13,C.brass);m.beam(a,brace,.21,C.orange);}
      } else if(s.id==="projectile") {
        const angle=(active?values.angle||35:35)/180*Math.PI;
        const a=[s.x,y+1,s.z-4],b=[s.x+Math.cos(angle)*2.4,y+1+Math.sin(angle)*2.4,s.z-4];m.beam(a,b,.75,C.brass);m.sphere(s.x,y+.8,s.z-4,.55,C.dark,8,3);
        const tx=s.x+(active?metrics.target||24:24),targetY=y+.8;
        m.cylinder(tx,ground(tx,s.z-4),s.z-4,1.6,Math.max(.08,targetY-ground(tx,s.z-4)),C.white,12);m.ring(tx,targetY+.02,s.z-4,.8,.3,C.orange,16);
        m.cylinder(tx,targetY,s.z-4,.1,3,C.dark,5);m.box(tx,targetY+2,s.z-4,1.1,.65,.1,C.orange);
        if(active){const speed=values.speed||15,g=metrics.gravity||9.81,flight=2*speed*Math.sin(angle)/g;
          const samples=low?18:30;for(let i=0;i<samples;i++){const t=flight*i/(samples-1),x=s.x+speed*Math.cos(angle)*t,yy=y+.8+speed*Math.sin(angle)*t-g*t*t/2;if(low)m.cylinder(x,yy-.06,s.z-4,.06,.12,C.orange,3,0);else m.sphere(x,yy,s.z-4,.09,C.orange,4,2);}
          const t=Math.min(flight,experiment.elapsed||0);m.sphere(s.x+speed*Math.cos(angle)*t,y+.8+speed*Math.sin(angle)*t-g*t*t/2,s.z-4,.36,C.brass,low?5:8,low?2:3);
        }
      } else if(s.id==="balance") {
        const left=active?metrics.leftTorque||36:36,right=active?(values.force||6)*(values.distance||2):24,tilt=clamp((left-right)/90,-.22,.22),z=s.z-3;
        const a=[s.x-6,y+3.5-tilt*6,z],b=[s.x+6,y+3.5+tilt*6,z];m.beam(a,b,.3,C.brass);
        const ld=active?metrics.leftDistance||3:3,rd=active?values.distance||2:2;
        const weights=[{p:[s.x-ld,y+3.5-tilt*ld,z],force:active?metrics.leftForce||12:12,color:C.dark},{p:[s.x+rd,y+3.5+tilt*rd,z],force:active?values.force||6:6,color:C.orange}];
        for(const weight of weights){const p=weight.p;m.beam(p,[p[0],p[1]-1.4,p[2]],.07,C.dark);m.cylinder(p[0],p[1]-1.55,p[2],.8,.12,C.white,10);const size=.4+Math.cbrt(weight.force)*.13;m.box(p[0],p[1]-1.4,p[2],size,size,size,weight.color);}
      } else if(s.id==="energy") {
        const z=s.z-5,height=active?values.height||4:4,base=ground(s.x+8,z)+.5,retention=active?metrics.retention||1:.8,mass=active?metrics.mass||3:3;
        const length=Math.hypot(12,height),acceleration=9.81*retention*height/length,t=active?clamp(.5*acceleration*Math.pow(experiment.elapsed||0,2)/length,0,1):0;
        const start=[s.x-4,base+height,z],end=[s.x+8,base,z];m.beam(start,end,2.3,C.white,.18);
        for(const side of [-1.25,1.25])m.beam([start[0],start[1]+.2,z+side],[end[0],end[1]+.2,z+side],.16,C.brass);
        m.cylinder(start[0],ground(start[0],z),z,.35,Math.max(.2,start[1]-ground(start[0],z)),C.stone,6);
        const radius=.3+Math.cbrt(mass)*.08,x=s.x-4+t*12+height/length*(radius+.09),yy=base+(1-t)*height+12/length*(radius+.09);m.sphere(x,yy,z,radius,C.brass,low?6:10,low?2:4);
        if(active)m.cylinder(s.x-7,y,s.z-5,.22,height,C.orange,6);
      } else if(s.id==="waves") {
        const phase=active?(experiment.elapsed||0)*(values.frequency||2):time*.25;
        for(let i=0;i<4;i++){const r=(phase*.8+i*.9)%3.3;m.ring(s.x,y+.41,s.z-4,r,.065,C.cyan,24);}
        if(active)for(let i=0;i<32;i++){
          const x=s.x-7+i*.45,yy=y+2.8+Math.sin(TAU*((i*.45)/(values.wavelength||3)-(experiment.elapsed||0)*(values.frequency||2)))*.7;
          if(low)m.cylinder(x,yy-.1,s.z-4,.085,.2,C.violet,3,0);else m.sphere(x,yy,s.z-4,.13,C.violet,4,2);
        }
      } else if(s.id==="garden") {
        const l=active?Math.round(values.length||3):complete?6:0,w=active?Math.round(values.width||2):complete?4:0;
        for(let x=0;x<Math.min(12,w);x++)for(let z=0;z<Math.min(12,l);z++){
          const xx=s.x+x*.6-3.3,zz=s.z-z*.6-3;m.cylinder(xx,y+.12,zz,.18,.48,C.mint,4,0);m.tri([xx-.08,y+.5,zz],[xx+.08,y+.5,zz],[xx,y+.7,zz],C.brass);
        }
      }
      if(complete)m.sphere(s.x+5,y+4.25,s.z+4,.38,C.brass,6,3);
    }
    if(state.beacon){const s=state.beacon,y=ground(s.x,s.z);m.cylinder(s.x,y,s.z,.12,10,C.brass,6);m.sphere(s.x,y+10,s.z,.6,C.brass,6,3);}
    for(const p of (state.pulses||[]).slice(-8)){if(p.t<1.2)m.ring(p.x,ground(p.x,p.z)+.16,p.z,.4+p.t*2,.07,C.cyan,12);}
    const hubY=ground(0,-4);m.sphere(0,hubY+3.4,-4,1.3,C.brass,6,3);
    for(let i=0;i<6;i++){const a=i/6*TAU+time*.06;m.sphere(Math.cos(a)*2.7,hubY+3.4+Math.sin(a*2)*.8,-4+Math.sin(a)*2.7,.2,done.size>i?C.brass:C.cyan,5,2);}
    regionalMotion(m,state);
    return m.array();
  }
  const VS=`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec3 aColor;uniform vec3 uCamera;uniform vec2 uAngles;uniform float uAspect;uniform float uOffset;varying vec3 vColor;varying float vDepth;void main(){vec3 d=aPosition-uCamera;float s=sin(uAngles.x),c=cos(uAngles.x);float lateral=d.x*c+d.z*s;float depth=d.x*s-d.z*c;float cp=cos(uAngles.y),sp=sin(uAngles.y);float yy=d.y*cp-depth*sp;float zz=depth*cp+d.y*sp;float f=1.42;gl_Position=vec4(lateral*f/uAspect,yy*f,zz*1.0023-0.40046,zz);gl_Position.x+=uOffset*zz;float light=0.62+0.38*abs(dot(normalize(aNormal),normalize(vec3(-.4,.9,.25))));vColor=aColor*light;vDepth=zz;}`;
  const FS=`precision mediump float;varying vec3 vColor;varying float vDepth;void main(){float fog=smoothstep(48.,190.,vDepth);gl_FragColor=vec4(mix(vColor,vec3(.67,.82,.79),fog),1.);}`;
  const SKYVS=`attribute vec2 aPosition;varying vec2 vPosition;void main(){gl_Position=vec4(aPosition,1.,1.);vPosition=aPosition;}`;
  const SKYFS=`precision mediump float;varying vec2 vPosition;uniform float uAspect;void main(){vec3 c=mix(vec3(.77,.86,.77),vec3(.26,.56,.65),clamp(vPosition.y*.65+.35,0.,1.));vec2 p=vec2(vPosition.x*uAspect,vPosition.y);float sun=1.-smoothstep(.045,.055,distance(p,vec2(-.8,.63)));float halo=(1.-smoothstep(.04,.3,distance(p,vec2(-.8,.63))))*.13;c=mix(c,vec3(1.,.92,.67),sun*.93+halo);gl_FragColor=vec4(c,1.);}`;
  function compile(gl,kind,source) {const s=gl.createShader(kind);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error(error);}return s;}
  function program(gl,vs,fs){const v=compile(gl,gl.VERTEX_SHADER,vs),f=compile(gl,gl.FRAGMENT_SHADER,fs),p=gl.createProgram();gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){const error=gl.getProgramInfoLog(p);gl.deleteProgram(p);throw new Error(error);}return p;}
  function faces(array,scene){
    const output=[];
    for(let i=0;i<array.length;i+=27){
      const x=(array[i]+array[i+9]+array[i+18])/3,y=(array[i+1]+array[i+10]+array[i+19])/3,z=(array[i+2]+array[i+11]+array[i+20])/3;
      const radius=Math.max(Math.hypot(array[i]-x,array[i+1]-y,array[i+2]-z),Math.hypot(array[i+9]-x,array[i+10]-y,array[i+11]-z),Math.hypot(array[i+18]-x,array[i+19]-y,array[i+20]-z));
      const layer=scene?(i<scene.terrainLength?0:i<scene.floorLength?1:2):(Math.abs(array[i+4])>.9&&y-ground(x,z)<.4?1:2);
      const light=.62+.38*Math.abs(array[i+3]*-.4+array[i+4]*.9+array[i+5]*.25),color=[0,1,2].map(k=>clamp(Math.round(array[i+6+k]*light*255/8)*8,0,255));
      output.push({i,x,y,z,radius,layer,color,key:color.join(",")});
    }
    return output;
  }
  function create(canvas, options={}) {
    let gl=null,ctx=null,disposed=false,w=800,h=600,frames=0,lastTris=0,lastDrawCalls=0,renderMs=0;
    let geomProgram,skyProgram,staticBuffer,dynamicBuffer,skyBuffer;
    if(!options.forceCanvas)try{gl=canvas.getContext("webgl",{alpha:false,antialias:options.quality!=="low",powerPreference:"low-power"});}catch(_){gl=null;}
    const scene=landscape(!gl);
    const staticFaces=gl?null:faces(scene.mesh,scene),colorCache=new Map();
    function setupGL(){
      geomProgram=program(gl,VS,FS);skyProgram=program(gl,SKYVS,SKYFS);staticBuffer=gl.createBuffer();dynamicBuffer=gl.createBuffer();skyBuffer=gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER,staticBuffer);gl.bufferData(gl.ARRAY_BUFFER,scene.mesh,gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER,skyBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
      gl.disable(gl.CULL_FACE);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
    }
    let contextLost=false;
    function lost(event){event.preventDefault();contextLost=true;}
    function restored(){if(disposed)return;setupGL();gl.viewport(0,0,canvas.width,canvas.height);contextLost=false;}
    if(gl){setupGL();canvas.addEventListener("webglcontextlost",lost);canvas.addEventListener("webglcontextrestored",restored);}
    else ctx=canvas.getContext("2d",{alpha:false});
    if(!gl&&!ctx)throw new Error("This browser cannot create a drawing surface.");
    const type=gl?"WebGL":"Canvas 2D";
    function resize(width,height,dpr=1){w=width;h=height;const scale=Math.min(options.quality==="low"?1:1.5,dpr);canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));if(gl)gl.viewport(0,0,canvas.width,canvas.height);else ctx.setTransform(scale,0,0,scale,0,0);}
    function drawBuffer(buffer,array){gl.bindBuffer(gl.ARRAY_BUFFER,buffer);if(array)gl.bufferData(gl.ARRAY_BUFFER,array,gl.DYNAMIC_DRAW);for(const [name,offset] of [["aPosition",0],["aNormal",12],["aColor",24]]){const a=gl.getAttribLocation(geomProgram,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,36,offset);}gl.drawArrays(gl.TRIANGLES,0,(array||scene.mesh).length/9);}
    function webgl(cam,array){
      gl.clearColor(.67,.82,.79,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(skyProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER,skyBuffer);const a=gl.getAttribLocation(skyProgram,"aPosition");gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,8,0);gl.uniform1f(gl.getUniformLocation(skyProgram,"uAspect"),w/h);gl.drawArrays(gl.TRIANGLES,0,3);
      gl.useProgram(geomProgram);gl.uniform3f(gl.getUniformLocation(geomProgram,"uCamera"),cam.x,cam.y,cam.z);gl.uniform2f(gl.getUniformLocation(geomProgram,"uAngles"),cam.yaw,cam.pitch||0);gl.uniform1f(gl.getUniformLocation(geomProgram,"uAspect"),w/h);gl.uniform1f(gl.getUniformLocation(geomProgram,"uOffset"),cam.offsetX||0);drawBuffer(staticBuffer);drawBuffer(dynamicBuffer,array);lastTris=(scene.mesh.length+array.length)/27;
    }
    function cameraPoint(x,y,z,cam){const dx=x-cam.x,dy=y-cam.y,dz=z-cam.z,s=Math.sin(cam.yaw),c=Math.cos(cam.yaw),depth=dx*s-dz*c,cp=Math.cos(cam.pitch||0),sp=Math.sin(cam.pitch||0);return [dx*c+dz*s,dy*cp-depth*sp,depth*cp+dy*sp];}
    function clip(poly){const output=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ai=a[2]>=.2,bi=b[2]>=.2;if(ai)output.push(a);if(ai!==bi){const t=(.2-a[2])/(b[2]-a[2]);output.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,.2]);}}return output;}
    function software(cam,array){
      const sky=ctx.createLinearGradient(0,0,0,h*.7);sky.addColorStop(0,"#438fa6");sky.addColorStop(1,"#c4dbc4");ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
      ctx.fillStyle="#f6e4ac";ctx.beginPath();ctx.arc(w*.23,h*.18,Math.max(9,w*.018),0,TAU);ctx.fill();
      const groups=new Map(),f=h*.71,sy=Math.sin(cam.yaw),cy=Math.cos(cam.yaw),cp=Math.cos(cam.pitch||0),sp=Math.sin(cam.pitch||0),offset=cam.offsetX||0;
      const transform=(x,y,z)=>{const dx=x-cam.x,dy=y-cam.y,dz=z-cam.z,depth=dx*sy-dz*cy;return [dx*cy+dz*sy,dy*cp-depth*sp,depth*cp+dy*sp];};
      let triangles=0;
      for(const [mesh,list] of [[scene.mesh,staticFaces],[array,faces(array)]])for(const face of list){
        const i=face.i,center=transform(face.x,face.y,face.z),radius=face.radius,depth=center[2];
        if(depth+radius<.2||depth-radius>145||Math.abs(center[0]+offset*depth*w/(2*f))>Math.max(.2,depth)*w/(2*f)+radius*1.7||Math.abs(center[1])>Math.max(.2,depth)*h/(2*f)+radius*1.7)continue;
        const a=transform(mesh[i],mesh[i+1],mesh[i+2]),b=transform(mesh[i+9],mesh[i+10],mesh[i+11]),c=transform(mesh[i+18],mesh[i+19],mesh[i+20]);
        if(Math.max(a[2],b[2],c[2])<.2||Math.min(a[2],b[2],c[2])>150)continue;
        const poly=clip([a,b,c]);if(poly.length<3)continue;
        const projected=poly.map(p=>[w/2+offset*w/2+p[0]*f/p[2],h/2-p[1]*f/p[2]]);
        if(projected.every(p=>p[0]<-5)||projected.every(p=>p[0]>w+5)||projected.every(p=>p[1]<-5)||projected.every(p=>p[1]>h+5))continue;
        let area=0;for(let k=0;k<projected.length;k++){const p=projected[k],q=projected[(k+1)%projected.length];area+=p[0]*q[1]-q[0]*p[1];}if(Math.abs(area)<4)continue;if(area<0)projected.reverse();
        const fogStep=Math.round(clamp((depth-48)/110,0,1)*10),colorKey=face.key+":"+fogStep;
        let color=colorCache.get(colorKey);if(!color){const fog=fogStep/10;color="rgb("+face.color.map((v,k)=>Math.round(v*(1-fog)+[171,209,201][k]*fog)).join(",")+")";colorCache.set(colorKey,color);}
        const bin=face.layer<2?0:depth<30?Math.floor(depth):30+Math.floor((depth-30)/3),key=face.layer+":"+bin+":"+color;
        let group=groups.get(key);if(!group){group={layer:face.layer,depth,bin,color,points:[]};groups.set(key,group);}group.points.push(projected);triangles++;
      }
      const batches=[...groups.values()].sort((a,b)=>a.layer-b.layer||b.depth-a.depth);
      for(const batch of batches){ctx.beginPath();for(const polygon of batch.points){ctx.moveTo(polygon[0][0],polygon[0][1]);for(let i=1;i<polygon.length;i++)ctx.lineTo(polygon[i][0],polygon[i][1]);ctx.closePath();}ctx.fillStyle=batch.color;ctx.fill();}
      lastTris=triangles;lastDrawCalls=batches.length;
    }
    function render(cam,state={}){if(disposed||contextLost)return;const start=performance.now(),experiment=state.experiment&&options.reduced?{...state.experiment,elapsed:state.experiment.result&&state.experiment.id!=="waves"?10:0}:state.experiment,array=dynamic({...state,experiment,time:options.reduced?0:state.time},!gl);if(gl&&!gl.isContextLost())webgl(cam,array);else if(ctx)software(cam,array);renderMs=performance.now()-start;frames++;}
    function dispose(){if(disposed)return;disposed=true;canvas.removeEventListener("webglcontextlost",lost);canvas.removeEventListener("webglcontextrestored",restored);if(gl){for(const b of [staticBuffer,dynamicBuffer,skyBuffer])gl.deleteBuffer(b);for(const p of [geomProgram,skyProgram])gl.deleteProgram(p);}}
    return {render,resize,dispose,type,colliders:scene.colliders,stats:()=>({renderer:type,triangles:lastTris,drawCalls:gl?3:lastDrawCalls,renderMs,frames,staticTriangles:scene.mesh.length/27,regionTriangles:{...scene.regionTriangles},contextLost})};
  }
  global.AtlasRenderer={create,stations:STATIONS,ground};
})(typeof window!=="undefined"?window:globalThis);
