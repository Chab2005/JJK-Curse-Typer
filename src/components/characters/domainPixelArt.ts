import { createSukunaDomainRenderer } from './sukunaDomainPixelArt';

/** Approved native pixel art for Gojo, Megumi, Yuta and Sukuna (BON-6, UI-4). */
export type DomainCharacter = 'gojo' | 'megumi' | 'yuta' | 'sukuna';
type Context = CanvasRenderingContext2D;
type Point = [number, number];

/** Create browser resources only after mount; no canvas or image work during SSR. */
export function createDomainRenderer(canvas: HTMLCanvasElement, character: DomainCharacter, showCharacter = true) {
  if (character === 'sukuna') return createSukunaDomainRenderer(canvas, showCharacter);
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return null;
  context.imageSmoothingEnabled = false;
  const W = 400, H = 220, TAU = Math.PI * 2;
  const clamp=(x: number)=>Math.max(0,Math.min(1,x)),ease=(x: number)=>{x=clamp(x);return x*x*(3-2*x);};
  const rand=(n: number)=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  const rgb=(h: string)=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  function rect(c: Context,x: number,y: number,w: number,h: number,color: string){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  function line(c: Context,x0: number,y0: number,x1: number,y1: number,color: string,width=1){
    x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
    const dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;let e=dx+dy;
    c.fillStyle=color;
    for(let n=0;n<1800;n++){c.fillRect(x0-(width>>1),y0-(width>>1),width,width);if(x0===x1&&y0===y1)break;const e2=e*2;if(e2>=dy){e+=dy;x0+=sx;}if(e2<=dx){e+=dx;y0+=sy;}}
  }
  function poly(c: Context,points: Point[],color: string){
    c.fillStyle=color;const ys=points.map(p=>p[1]);
    for(let y=Math.floor(Math.min(...ys));y<=Math.ceil(Math.max(...ys));y++){
      const xs: number[]=[];for(let i=0,j=points.length-1;i<points.length;j=i++){
        const [x1,y1]=points[j],[x2,y2]=points[i];if((y1<=y&&y2>y)||(y2<=y&&y1>y))xs.push(x1+(y-y1)*(x2-x1)/(y2-y1));
      }xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2){const x=Math.ceil(xs[i]),r=Math.floor(xs[i+1]);if(r>=x)c.fillRect(x,y,r-x+1,1);}
    }
  }
  function oval(c: Context,x: number,y: number,rx: number,ry: number,color: string){c.fillStyle=color;for(let yy=-ry;yy<=ry;yy++){const xx=Math.floor(rx*Math.sqrt(Math.max(0,1-yy*yy/(ry*ry))));c.fillRect(Math.round(x-xx),Math.round(y+yy),xx*2+1,1);}}
  function path(c: Context,points: Point[],color: string,width=1){for(let i=1;i<points.length;i++)line(c,...points[i-1],...points[i],color,width);}
  function layer(paint: (c: Context) => void){const image=document.createElement('canvas');image.width=W;image.height=H;const c=image.getContext('2d')!;c.imageSmoothingEnabled=false;paint(c);return image;}
  function dither(c: Context,colors: string[],field: (x: number,y: number) => number){
    const rgba=colors.map(rgb),data=c.createImageData(W,H);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      const f=Math.max(0,Math.min(colors.length-1.001,field(x,y))),i=Math.floor(f),j=(f-i)>(bayer[(y%4)*4+x%4]+.5)/16?i+1:i,q=rgba[j],n=(y*W+x)*4;
      data.data[n]=q[0];data.data[n+1]=q[1];data.data[n+2]=q[2];data.data[n+3]=255;
    }c.putImageData(data,0,0);
  }
  const actorPalette=['#080c18','#151d2c','#29374d','#43506b','#687997','#9ab3c5','#e5e4df','#c9d5e4','#f8e8ca','#dbb598','#ab7f78','#73556c','#302a43','#b6aed1','#f1dce9','#7c6454','#b0976e','#4c434c','#20529b','#3879bc','#6ab8de','#152951'].map(rgb);
  let spriteCanvas: HTMLCanvasElement | null = null, disposed = false, lastTime = 5;
  const sprite = new Image();
  sprite.onload = () => {
    if(disposed)return;
    const stamp=document.createElement('canvas');stamp.width=272;stamp.height=54;const c=stamp.getContext('2d')!;c.imageSmoothingEnabled=false;c.drawImage(sprite,0,0);const data=c.getImageData(0,0,272,54);
    for(let n=0;n<data.data.length;n+=4){if(data.data[n+3]<128){data.data[n+3]=0;continue;}let best=actorPalette[0],distance=Infinity;for(const q of actorPalette){const d=(q[0]-data.data[n])**2+(q[1]-data.data[n+1])**2+(q[2]-data.data[n+2])**2;if(d<distance){distance=d;best=q;}}data.data[n]=best[0];data.data[n+1]=best[1];data.data[n+2]=best[2];data.data[n+3]=255;}
    c.putImageData(data,0,0);spriteCanvas=stamp;draw(lastTime);
  };
  if(showCharacter)sprite.src=`/images/characters/domains/${character}-idle.png`;
  function actor(c: Context,t: number,x=200,feet=160){if(showCharacter&&spriteCanvas)c.drawImage(spriteCanvas,(Math.floor(t*8.9)%8)*34,0,34,54,Math.round(x-17),feet-54,34,54);}
  // Gojo: stepped circular contours, discrete star clusters and violet rays.
  const gojoBackground=character==='gojo'?layer(c=>{
    dither(c,['#04040d','#0b0b1e','#19132e','#2c1b48'],(x,y)=>Math.max(0,2.9-Math.hypot((x-200)*.85,y-101)/69));
    for(let i=0;i<230;i++){const x=Math.floor(rand(i+40)*W),y=Math.floor(rand(i+350)*H);rect(c,x,y,1,1,i%6===0?'#79508f':'#322743');}
    for(let i=0;i<144;i++){const a=i/144*TAU+.006*Math.sin(i*19),ca=Math.cos(a),sa=Math.sin(a),near=53+rand(i+500)*8,far=160+rand(i+510)*110;line(c,200+ca*near,101+sa*near,200+ca*far,101+sa*far,i%4===0?'#42294f':'#292044');}
  }):null;
  const ringImages=character==='gojo'?[0,1].map(pulse=>layer(c=>{
    const rr=36+pulse;
    oval(c,200,101,rr+12,rr+12,'#291b43');oval(c,200,101,rr+8,rr+8,'#472761');oval(c,200,101,rr+5,rr+5,'#633780');oval(c,200,101,rr+3,rr+3,'#a979cb');oval(c,200,101,rr+1,rr+1,'#edd9f4');oval(c,200,101,rr,rr,'#02040a');
    for(let i=0;i<38;i++){const a=i/38*TAU,x=Math.round(200+Math.cos(a)*(rr+6)),y=Math.round(101+Math.sin(a)*(rr+6));rect(c,x,y,i%4===0?2:1,1,i%3===0?'#e8bee8':'#784899');}
  })):[];
  function gojo(c: Context,t: number){
    c.drawImage(gojoBackground!,0,0);const reveal=ease((t-.35)/1.65);
    for(let i=0;i<106;i++){
      const a=i/106*TAU+rand(i+310)*.018,ca=Math.cos(a),sa=Math.sin(a),cycle=(t*(.12+rand(i+530)*.13)+rand(i+600))%1;
      const r=43+cycle*258,end=r+5+cycle*25,color=i%9===0?'#e8c9ed':i%4===0?'#b986c5':'#7959a8';
      if(reveal>.5)line(c,200+ca*r,101+sa*r,200+ca*end,101+sa*end,color);
    }
    if(reveal===1)c.drawImage(ringImages[Math.sin(t*1.3)>.6?1:0],0,0);
    else if(reveal>0){const size=Math.max(1,Math.round(104*reveal));c.drawImage(ringImages[0],148,49,104,104,Math.round(200-size/2),Math.round(101-size/2),size,size);}
    for(let i=0;i<12;i++){const phase=Math.sin(t*1.2+i*2);if(phase>.76&&reveal>.7){const x=Math.floor(rand(i+920)*400),y=Math.floor(rand(i+940)*175);line(c,x-2,y,x+2,y,'#b794d7');line(c,x,y-2,x,y+2,'#b794d7');rect(c,x,y,1,1,'#f3e7fa');}}
    if(showCharacter){oval(c,200,161,23,3,'#211b39');oval(c,200,160,17,1,'#5c447c');actor(c,t);}
  }

  // Megumi: a shallow uneven crown and three tightly overlapping vertebrae.
  const megumiBackground=character==='megumi'?layer(c=>{
    dither(c,['#01050b','#030a18','#06142a','#0b2340'],(x,y)=>Math.max(0,1.9-Math.hypot((x-200)*1.3,y-80)/90));
    rect(c,0,147,400,73,'#010407');
    for(let i=0;i<110;i++){const y=148+Math.floor(rand(i+500)*71),x=Math.floor(rand(i+560)*400),w=2+Math.floor(rand(i+590)*12);rect(c,x,y,w,1,i%5===0?'#082334':'#030d17');}
    for(let i=0;i<10;i++)rect(c,Math.floor(rand(i+620)*400),146+Math.floor(rand(i+660)*40),12+Math.floor(rand(i+680)*30),1,'#061927');
  }):null;
  const spineImage=character==='megumi'?layer(c=>{
    poly(c,[[189,42],[187,101],[200,119],[213,101],[211,42]],'#073451');
    const widths=[29,34,31];
    for(let i=2;i>=0;i--){const y=48+i*20,w=widths[i],at=(pts: Point[]): Point[]=>pts.map(([x,yy])=>[200+x,y+yy]);
      const shape: Point[]=[[-7,-6],[-16,-7],[-w+5,-5],[-w,-2],[-w-3,7],[-w+2,17],[-w+10,14],[-15,7],[-11,17],[0,26],[11,17],[15,7],[w-10,14],[w-2,17],[w+3,7],[w,-2],[w-5,-5],[16,-7],[7,-6]];
      poly(c,at(shape),'#146caa');path(c,at([...shape,shape[0]]),'#56cfe7');
      poly(c,at([[-w,-2],[-12,5],[-5,20],[-16,11],[-w+4,9]]),'#063352');
      poly(c,at([[w,-2],[12,5],[5,20],[16,11],[w-4,9]]),'#04263f');
      poly(c,at([[-w+5,-5],[-16,-7],[-7,-6],[-9,3],[-18,1],[-w+2,3]]),'#2cafd6');
      poly(c,at([[w-5,-5],[16,-7],[7,-6],[9,3],[18,1],[w-2,3]]),'#258bb8');
      poly(c,at([[-5,-5],[-8,1],[-5,11],[0,24],[5,10],[7,1],[5,-5]]),'#239bc8');
      poly(c,at([[-5,-5],[-8,1],[-5,11],[-1,18],[-1,-4]]),'#5adbed');
      line(c,200, y+9,200,y+23,'#0e6495');
      for(const side of [-1,1])path(c,at([[side*(w-7),0],[side*(w-10),5],[side*(w-8),10]]),'#0a4e79');
      for(let k=0;k<4;k++)rect(c,200+Math.floor((rand(i*4+k+98)-.5)*w*1.3),y-4+Math.floor(rand(k+79)*4),1,1,'#0d6992');
    }
    poly(c,[[172,46],[175,39],[184,37],[190,40],[197,38],[206,40],[214,39],[224,41],[229,47],[223,51],[215,50],[208,46],[200,48],[191,45],[183,49],[176,48]],'#2ba5ce');
    path(c,[[175,40],[184,38],[190,41],[197,39],[206,41],[214,40],[223,42]],'#70dfec');
    poly(c,[[180,43],[187,41],[195,43],[203,42],[211,44],[220,44],[213,46],[204,45],[195,46],[186,45]],'#06304a');
  }):null;
  const threads=[...Array.from({length:66},(_,i)=>thread(false,i)),...Array.from({length:26},(_,i)=>thread(true,i))];
  function thread(lower: boolean,i: number){const seed=i+(lower?730:110),side=i%2?-1:1,top=!lower&&i%4===0;return {lower,i,seed,side,x:lower?200+side*(4+rand(seed)*8):200+(rand(seed+8)-.5)*37,y:lower?110+rand(seed+9)*4:41+rand(seed+60)*4.5,ex:lower?200+side*(165+rand(seed+12)*70):top?40+rand(seed+19)*320:200+side*(210+rand(seed+12)*65),ey:lower?88+rand(seed+42)*57:top?-35-rand(seed+22)*50:8+rand(seed+42)*79,amp:(4+rand(seed+31)*8.5)*1.85*(lower?.9:1),arch:(lower?1:-1)*(14+rand(seed+2)*17),rate:1.45*(1.35+rand(seed+14)),phase:rand(seed)*TAU};}
  function megumi(c: Context,t: number){
    c.drawImage(megumiBackground!,0,0);
    for(const th of threads){const reveal=ease((t-(th.lower?2.15:1.85))/(th.lower?1.4:1.65));if(!reveal)continue;const points: Point[]=[],phase=t*th.rate+th.phase;
      for(let j=0;j<=24;j++){const u=j/24*reveal,flex=u**1.35;points.push([th.x+(th.ex-th.x)*u+Math.sin(u*8.3-phase)*th.amp*.35*flex,th.y+(th.ey-th.y)*u+Math.sin(u*Math.PI)*th.arch+flex*th.amp*(Math.sin(u*10-phase)+Math.sin(u*22+phase*.7)*.28)]);}
      path(c,points,th.i%5===0?'#57cce7':th.i%3===0?'#1c78bf':'#103c77');
    }
    const reveal=ease((t-1)/1.55);if(reveal)c.drawImage(spineImage!,0,Math.round((1-reveal)*31));
    for(let i=0;i<3;i++){const r=17+Math.floor(((t*.14+i/3)%1)*23);for(let a=0;a<28;a++){if(a%4===0)continue;const q=a/28*TAU;rect(c,200+Math.cos(q)*r,162+Math.sin(q)*r*.12,2,1,'#0a2941');}}
    actor(c,t);
    const stamp=spriteCanvas;if(showCharacter&&stamp){for(let y=0;y<8;y++){if(y%3===0)continue;c.drawImage(stamp,(Math.floor(t*8.9)%8)*34,53-y*3,34,1,183+Math.round(Math.sin(t+y)*1),163+y,34,1);}}
  }

  // Yuta: chipped stone and planted swords, all drawn on the native pixel grid.
  const yp={ink:'#211e2e',sky:['#594456','#886777','#b88d89','#e6b89b','#f6d5ac'],stone:['#d4ccbc','#a59b9f','#6d6478','#474253'],ground:['#b39589','#796878','#4c4158','#211c30'],rope:['#3e2034','#722d44','#a54c5a','#d3827c'],gold:'#c6aa70',blade:'#c4d2d2'};
  function stone(c: Context,x: number,y: number,w: number,h: number,seed: number){
    const notch=2+Math.floor(rand(seed)*3),pts: Point[]=[[x,y+notch],[x+w-2,y],[x+w,y+h-3],[x+w-4,y+h],[x,y+h]];
    poly(c,pts,yp.stone[0]);poly(c,[[x+w-3,y],[x+w+4,y-3],[x+w+6,y+h-5],[x+w,y+h-3]],yp.stone[2]);
    path(c,[[x,y+notch],[x+w-2,y]],yp.stone[1]);
    for(let k=0;k<3;k++){const xx=x+3+Math.floor(rand(seed+k+40)*Math.max(2,w-6)),yy=y+Math.floor(rand(seed+k+20)*h);path(c,[[xx,yy],[xx-2,yy+3],[xx+1,yy+5]],yp.stone[1]);}
    for(let k=0;k<2;k++){const xx=x+2+Math.floor(rand(seed+k+10)*(w-4));line(c,xx,y,xx+1,y-4,yp.stone[3]);}
  }
  function cross(c: Context,x: number,foot: number,size: number,seed: number){
    const w=Math.max(3,Math.round(9*size)),h=Math.round(75*size),y=foot-h;
    stone(c,x-w/2,y,w,h,seed);stone(c,x-25*size,y+20*size,49*size,12*size,seed+12);
    path(c,[[x-1,y+h*.5],[x-4,y+h*.57],[x,y+h*.64],[x-2,y+h*.71]],yp.stone[2]);
  }
  const yutaBack=character==='yuta'?layer(c=>{
    dither(c,yp.sky,(x,y)=>Math.min(3.99,y/31+.18*Math.sin(x*.02)));
    for(let i=0;i<8;i++){const y=12+i*12,x=-20+Math.floor(rand(i+440)*150);poly(c,[[x,y+4],[x+70,y],[x+140,y+4],[x+230,y+3],[x+250,y+6],[x,y+7]],yp.sky[Math.min(3,Math.floor(y/31))]);}
    for(let i=0;i<16;i++){const x=Math.floor(rand(i+480)*400),y=120+Math.floor(rand(i+500)*6),h=14+Math.floor(rand(i+520)*20);rect(c,x,y-h,3,h,'#ab8a86');rect(c,x-5,y-h+6,14,3,'#ab8a86');}
    rect(c,0,125,400,95,yp.ground[0]);
    for(let y=126;y<220;y++){
      const f=(y-126)/94*3,low=Math.min(2,Math.floor(f)),fraction=f-low;
      for(let x=0;x<400;x++)if(fraction>(bayer[(y%4)*4+x%4]+.5)/16)rect(c,x,y,1,1,yp.ground[low+1]);else rect(c,x,y,1,1,yp.ground[low]);
    }
    for(let i=0;i<28;i++){const x=rand(i+580)*W,y=129+rand(i+610)*91;line(c,200+(x-200)*.15,126,x,y,yp.ground[2]);}
  }):null;
  const yutaRuins=character==='yuta'?layer(c=>{
    for(let i=0;i<8;i++){const x=16+i*51+rand(i+650)*18;if(x>171&&x<231)continue;cross(c,x,146+rand(i+670)*12,.36+rand(i+690)*.2,i+710);}
    cross(c,66,160,1.35,750);cross(c,328,163,1.24,770);
    cross(c,15,155,.68,790);cross(c,384,158,.7,810);cross(c,128,152,.61,830);cross(c,275,152,.6,850);
    for(let i=0;i<44;i++){const x=Math.floor(rand(i+900)*400),y=141+Math.floor(rand(i+950)*79),s=2+Math.floor(rand(i+980)*5);poly(c,[[x,y],[x+s,y-2],[x+s+4,y+1],[x+2,y+3]],yp.stone[i%3===0?0:1]);poly(c,[[x+2,y+3],[x+s+4,y+1],[x+s+3,y+5],[x+2,y+6]],yp.stone[3]);}
  }):null;
  function katana(c: Context,s: {x: number;y: number;h: number;angle: number;width: number}){
    const dx=Math.sin(s.angle),dy=-Math.cos(s.angle),nx=Math.cos(s.angle),ny=Math.sin(s.angle),point=(d: number): Point=>[s.x+dx*d,s.y+dy*d],guard=point(s.h*.73),tip=point(s.h),handle=point(s.h*.76);
    const blade: Point[]=[point(0),[guard[0]-nx,guard[1]-ny],[guard[0]+nx,guard[1]+ny],[s.x+1,s.y-3]];poly(c,blade,yp.stone[3]);line(c,s.x,s.y,...guard,yp.blade);
    line(c,...handle,...tip,yp.ink,Math.max(1,s.width));
    for(let j=0;j<5;j++){const pos=point(s.h*(.8+j*.04));rect(c,...pos,1,1,j%2?yp.stone[1]:yp.rope[2]);}
    line(c,guard[0]-nx*s.width*1.6,guard[1]-ny*s.width*1.6,guard[0]+nx*s.width*1.6,guard[1]+ny*s.width*1.6,yp.gold);rect(c,...tip,Math.max(1,s.width),1,yp.gold);
  }
  const swords=Array.from({length:130},(_,i)=>{const depth=rand(i+1100),y=130+depth*95,x=rand(i+1200)*400;return{x,y,h:9+depth*61,angle:(rand(i+1300)-.5)*.34,width:depth>.7?3:depth>.35?2:1,tier:depth>.76?3:depth>.4?2:depth>.17?1:0};}).filter(s=>!(Math.abs(s.x-200)<20&&s.y>143&&s.y<177));
  const swordLayers=character==='yuta'?[0,1,2,3].map(tier=>layer(c=>swords.filter(s=>s.tier===tier).sort((a,b)=>a.y-b.y).forEach(s=>katana(c,s)))):[];
  function knotBand(c: Context,start: Point,curves: [number,number,number,number,number,number][],range: Point | null=null){
    const pts: Point[]=[start];let previous=start;
    for(const [x1,y1,x2,y2,x3,y3]of curves){for(let j=1;j<=32;j++){const t=j/32,u=1-t;pts.push([u*u*u*previous[0]+3*u*u*t*x1+3*u*t*t*x2+t*t*t*x3,u*u*u*previous[1]+3*u*u*t*y1+3*u*t*t*y2+t*t*t*y3]);}previous=[x3,y3];}
    const normals=pts.map((p,i): Point=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1;return[-dy/d,dx/d];});
    const first=range?Math.round(range[0]*(pts.length-1)):0,last=range?Math.round(range[1]*(pts.length-1)):pts.length-1;
    const taper=(i: number)=>1-(1-8/16)*ease((i/(pts.length-1)-.78)/.22);
    const toPixel=(p: Point,n: Point,offset: number,i: number): Point=>[207+(p[0]+n[0]*offset*taper(i))*.54,64+(p[1]+n[1]*offset*taper(i))*.54];
    function ribbon(extra: number,color: string){const shape: Point[]=[];for(let i=first;i<=last;i++)shape.push(toPixel(pts[i],normals[i],8+extra,i));for(let i=last;i>=first;i--)shape.push(toPixel(pts[i],normals[i],-8-extra,i));poly(c,shape,color);}
    ribbon(2,yp.rope[0]);ribbon(0,yp.rope[1]);
    for(const [offset,color]of ([[-4,yp.rope[2]],[-2,yp.rope[3]],[1,yp.rope[2]],[5,yp.rope[0]]] as [number,string][])){const fiber: Point[]=[];for(let i=first;i<=last;i++)fiber.push(toPixel(pts[i],normals[i],offset,i));path(c,fiber,color);}
  }
  const yutaCord=character==='yuta'?layer(c=>{
    const left: [number,number,number,number,number,number][]=[[-43,-78,-38,-37,-25,-12],[-16,5,8,29,22,34],[44,52,65,24,59,5],[57,-19,41,-35,22,-20],[0,-2,-150,18,-410,-40]];
    const right: [number,number,number,number,number,number][]=[[45,-79,36,-40,22,-13],[14,5,2,23,-11,32],[-34,50,-61,26,-59,8],[-61,-20,-35,-35,-18,-19],[6,-1,150,18,390,-40]];
    knotBand(c,[-40,-118],left);knotBand(c,[42,-122],right);knotBand(c,[-40,-118],left,[.2,.4]);
  }):null;
  function yuta(c: Context,t: number){
    c.drawImage(yutaBack!,0,0);const ruins=ease((t-.45)/1.5),cord=ease((t-1.4)/1.5);
    if(ruins)c.drawImage(yutaRuins!,0,Math.round((1-ruins)*15));
    if(cord)c.drawImage(yutaCord!,0,Math.round(Math.sin(t*.65)+(1-cord)*-18));
    for(let tier=0;tier<3;tier++){const reveal=ease((t-.8-tier*.43)/1.25);if(reveal)c.drawImage(swordLayers[tier],0,Math.round((1-reveal)*(18+tier*18)));}
    oval(c,200,162,18,2,yp.ink);actor(c,t,200,162);
    const front=ease((t-1.9)/1.2);if(front)c.drawImage(swordLayers[3],0,Math.round((1-front)*100));
    for(let i=0;i<25;i++){const x=Math.floor(rand(i+1500)*400+Math.sin(t*.3+i)*3),y=Math.floor((rand(i+1550)*170-t*(1.5+rand(i+1580)*2)+10000)%170);if(t>1.5)rect(c,x,y,1,1,i%4===0?'#f6d5ac':'#b88d89');}
    for(let i=0;i<swords.length;i+=16){const s=swords[i];if(Math.sin(t*.9+i)> .97&&s.tier>0&&s.tier<3&&t>3){const x=Math.round(s.x+Math.sin(s.angle)*s.h*.4),y=Math.round(s.y-s.h*.4);line(c,x-2,y,x+2,y,'#f8e8ca');line(c,x,y-3,x,y+3,'#f8e8ca');}}
  }

  function draw(time: number) {
    if(disposed)return;
    lastTime=time;
    if(character==='gojo')gojo(context!,time);else if(character==='megumi')megumi(context!,time);else yuta(context!,time);
  }
  return {draw,dispose(){disposed=true;sprite.onload=null;}};
}
