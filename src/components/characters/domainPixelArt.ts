/** Approved native pixel art for Gojo and Megumi (BON-6, UI-4). */
export type DomainCharacter = 'gojo' | 'megumi';
type Context = CanvasRenderingContext2D;
type Point = [number, number];

/** Create browser resources only after mount; no canvas or image work during SSR. */
export function createDomainRenderer(canvas: HTMLCanvasElement, character: DomainCharacter, showCharacter = true) {
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

  function draw(time: number) {
    if(disposed)return;
    lastTime=time;
    if(character==='gojo')gojo(context!,time);else megumi(context!,time);
  }
  return {draw,dispose(){disposed=true;sprite.onload=null;}};
}
