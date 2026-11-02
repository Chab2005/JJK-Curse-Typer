import { getDomainCuts } from './domainCuts';

type Context = CanvasRenderingContext2D;
type Point = [number, number];
type Palette = typeof CRIMSON_SANCTUARY;
const CRIMSON_SANCTUARY = {name:'Crimson Sanctuary',ink:'#080b16',sky:['#13090f','#290b18','#451322'],vein:'#631b2c',wood:['#461a26','#82302f','#bd4b38','#ef8254'],roof:['#101a28','#283c50','#496477'],bone:['#dce0cb','#a3b9b7','#62818f'],water:['#050c16','#102632','#254956'],flash:'#fff2dd',cut:'#c84562',base:150,scale:1,interval:.14,angles:[-.42,.58,-.15],parallel:2,tear:3};

/** Approved pixel shrine, reflection and stationary slash barrage (BON-6, UI-4). */
export function createSukunaDomainRenderer(target: HTMLCanvasElement, showCharacter = true) {
  const c = target.getContext('2d', { alpha: false });
  if (!c) return null;
  c.imageSmoothingEnabled = false;
  const W=400,H=220,p=CRIMSON_SANCTUARY;
  const clamp=(x: number)=>Math.min(1,Math.max(0,x)),ease=(x: number)=>{x=clamp(x);return x*x*(3-2*x);};
  const rand=(n: number)=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  const bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  const rgb=(hex: string)=>[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
  function rect(c: Context,x: number,y: number,w: number,h: number,color: string){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  function line(c: Context,x0: number,y0: number,x1: number,y1: number,color: string,width=1){
    x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
    const dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;let error=dx+dy;
    c.fillStyle=color;const offset=width>>1;
    for(let n=0;n<1600;n++){c.fillRect(x0-offset,y0-offset,width,width);if(x0===x1&&y0===y1)break;const e2=2*error;if(e2>=dy){error+=dy;x0+=sx;}if(e2<=dx){error+=dx;y0+=sy;}}
  }
  function poly(c: Context,points: Point[],color: string){
    c.fillStyle=color;const ys=points.map(p=>p[1]),min=Math.floor(Math.min(...ys)),max=Math.ceil(Math.max(...ys));
    for(let y=min;y<=max;y++){
      const xs: number[]=[];
      for(let i=0,j=points.length-1;i<points.length;j=i++){
        const [x1,y1]=points[j],[x2,y2]=points[i];if((y1<=y&&y2>y)||(y2<=y&&y1>y))xs.push(x1+(y-y1)*(x2-x1)/(y2-y1));
      }
      xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2){const x=Math.ceil(xs[i]),right=Math.floor(xs[i+1]);if(right>=x)c.fillRect(x,y,right-x+1,1);}
    }
  }
  function oval(c: Context,x: number,y: number,rx: number,ry: number,color: string){c.fillStyle=color;for(let yy=-ry;yy<=ry;yy++){const xx=Math.floor(rx*Math.sqrt(Math.max(0,1-yy*yy/(ry*ry))));c.fillRect(Math.round(x-xx),Math.round(y+yy),xx*2+1,1);}}
  function makeCanvas(w=W,h=H){const image=document.createElement('canvas');image.width=w;image.height=h;const c=image.getContext('2d',{willReadFrequently:true})!;c.imageSmoothingEnabled=false;return {image,c};}
  function bake(paint: (c: Context)=>void){const layer=makeCanvas();paint(layer.c);return layer.image;}
  function horn(c: Context,x: number,y: number,side: number,size: number,p: Palette){
    const shape=[[-3,2],[-8,-1],[-12,-8],[-13,-15],[-10,-24],[-3,-32],[1,-34],[-4,-23],[-5,-16],[-4,-10],[2,-3],[3,0]];
    const pts: Point[]=shape.map(([px,py]): Point=>[x+Math.round(px*side*size),y+Math.round(py*size)]);
    poly(c,pts,p.ink);
    poly(c,[[-3,0],[-8,-3],[-11,-10],[-11,-16],[-7,-25],[-2,-30],[-6,-17],[-5,-10],[0,-4]].map(([px,py]): Point=>[x+Math.round(px*side*size),y+Math.round(py*size)]),p.roof[1]);
    line(c,x-9*side*size,y-13*size,x-5*side*size,y-25*size,p.roof[2]);
    for(let i=0;i<5;i++){const yy=y-3-i*4*size,xx=x-side*(6+Math.sin(i*.7)*3)*size;line(c,xx-3*size,yy,xx+2*size,yy+1,p.roof[0]);}
  }
  function skullSprite(p: Palette){
    const {image,c}=makeCanvas(35,40);c.translate(17,21);
    for(const side of [-1,1]){
      poly(c,[[side*7,-6],[side*12,-9],[side*15,-15],[side*15,-19],[side*17,-14],[side*15,-7],[side*9,-2]],p.roof[0]);
      line(c,side*10,-6,side*14,-12,p.bone[2]);line(c,side*14,-12,side*15,-17,p.bone[1]);
    }
    poly(c,[[-8,-10],[-11,-7],[-12,-1],[-8,5],[-5,8],[-3,17],[3,17],[5,8],[8,5],[12,-1],[11,-7],[8,-10]],p.ink);
    poly(c,[[-7,-9],[-10,-6],[-10,0],[-6,5],[-4,8],[-2,16],[2,16],[4,8],[7,4],[10,-1],[9,-6],[6,-9]],p.bone[1]);
    poly(c,[[-7,-8],[-9,-5],[-8,-1],[-3,1],[-2,11],[0,14],[1,5],[6,1],[7,-6],[4,-8]],p.bone[0]);
    poly(c,[[-8,-3],[-4,-4],[-3,-1],[-4,2],[-7,2]],p.ink);poly(c,[[4,-4],[8,-3],[7,2],[4,2],[3,-1]],p.ink);
    rect(c,-1,3,2,6,p.bone[2]);rect(c,-2,12,1,2,p.ink);rect(c,2,12,1,2,p.ink);rect(c,-1,-8,1,3,p.bone[2]);line(c,-2,-5,0,-3,p.bone[2]);return image;
  }
  function skull(c: Context,stamp: HTMLCanvasElement,x: number,y: number,width: number,mirror=false){
    const height=Math.round(width*40/35),left=Math.round(x-width/2),top=Math.round(y-height*.54);
    if(mirror){c.save();c.translate(left+width,top);c.scale(-1,1);c.drawImage(stamp,0,0,width,height);c.restore();}else c.drawImage(stamp,left,top,width,height);
  }
  function tooth(c: Context,x: number,y: number,w: number,h: number,p: Palette){
    const sign=h<0?-1:1,hh=Math.abs(h);
    poly(c,[[x-w/2-1,y],[x+w/2+1,y],[x+w/2+1,y+sign*(hh-1)],[x+1,y+sign*(hh+1)],[x-w/2,y+sign*hh]],p.ink);
    poly(c,[[x-w/2,y],[x+w/2-1,y],[x+w/2,y+sign*(hh-2)],[x+1,y+sign*hh],[x-w/2+1,y+sign*(hh-1)]],p.bone[1]);
    rect(c,x-w/2+1,Math.min(y,y+sign*(hh-2)),Math.max(1,w-3),hh-1,p.bone[0]);
  }
  function tree(c: Context,x: number,y: number,side: number,p: Palette){
    line(c,x,y,x+side*2,y-34,p.ink,3);for(let i=0;i<6;i++){const s=i%2?-1:1,yy=y-10-i*4;line(c,x,yy,x+s*(7+i),yy-7,p.ink);line(c,x+s*(7+i),yy-7,x+s*(11+i),yy-14,p.ink);}line(c,x,y-5,x+side*2,y-24,p.roof[1]);
  }
  function paintTemple(c: Context,p: Palette,stamp: HTMLCanvasElement){
    tree(c,130,143,-1,p);tree(c,272,143,1,p);
    for(const [x,y,side,size] of [[154,55,-1,1.1],[174,47,-1,.9],[227,46,1,1],[248,57,1,1.15]])horn(c,x,y,side,size,p);
    // Two side mouths disappear behind the heavily shaded timber posts.
    for(const side of [-1,1]){
      const x=200+side*54;
      poly(c,[[x-19,94],[x-12,88],[x+8,88],[x+19,98],[x+21,119],[x+12,137],[x-14,136],[x-22,117]],p.wood[0]);
      poly(c,[[x-13,98],[x-6,93],[x+7,94],[x+14,104],[x+14,125],[x+7,134],[x-10,130],[x-16,113]],p.ink);
      for(let i=0;i<5;i++)tooth(c,x-11+i*5,96+Math.abs(i-2)*3,5,8,p);
    }
    poly(c,[[158,145],[154,131],[156,115],[162,103],[173,94],[187,89],[205,87],[224,92],[237,103],[244,116],[246,132],[240,145]],p.wood[0]);
    poly(c,[[161,144],[160,126],[164,113],[173,104],[186,99],[204,97],[219,101],[231,109],[238,122],[239,144]],p.ink);
    for(let i=0;i<10;i++){
      const f=(i-4.5)/4.5,x=Math.round(200+f*34),y=Math.round(94+Math.pow(Math.abs(f),1.7)*15);
      tooth(c,x,y,7,12-Math.round(Math.abs(f)*2),p);tooth(c,x,142-Math.round(Math.abs(f)*2),7,-9,p);
    }
    // Small pixel clusters suggest recessed gums, carved supports and worn wood.
    for(let i=0;i<14;i++){const x=163+rand(i+71)*77,y=96+rand(i+81)*44;if(x<171||x>230)rect(c,x,y,2,3,p.wood[1]);}
    for(const x of [143,248]){
      rect(c,x-2,80,13,66,p.ink);rect(c,x,81,9,64,p.wood[1]);rect(c,x+2,83,3,60,p.wood[2]);rect(c,x+2,84,1,56,p.wood[3]);rect(c,x+7,82,2,61,p.wood[0]);
      for(let i=0;i<4;i++){rect(c,x-8+i*2,76+i*4,24-i*4,3,p.wood[i%2?0:2]);rect(c,x-6+i*2,77+i*4,18-i*4,1,p.wood[3]);}
      skull(c,stamp,x+4,88,14);
    }
    rect(c,135,75,129,10,p.wood[0]);rect(c,137,76,125,3,p.wood[2]);
    for(let x=138;x<263;x+=5){rect(c,x,79,2,4,p.wood[3]);rect(c,x+2,82,3,2,p.ink);}
    // Roof planes use stepped outlines and hand-placed tile clusters.
    const roof: Point[]=[[115,61],[119,65],[128,68],[146,65],[169,54],[185,42],[200,29],[215,42],[231,54],[254,65],[272,68],[282,65],[286,61],[281,73],[270,78],[129,78],[119,73]];
    poly(c,roof,p.ink);
    poly(c,[[121,66],[130,69],[150,64],[174,51],[200,31],[227,53],[251,65],[271,70],[280,66],[276,73],[269,75],[131,75],[124,72]],p.roof[1]);
    poly(c,[[132,69],[154,62],[176,50],[200,34],[224,51],[248,64],[269,70]],p.roof[0]);
    for(let row=0;row<6;row++){
      const y=47+row*5,left=180-row*10,right=220+row*10;
      for(let x=left+(row%2)*3;x<right;x+=6){line(c,x,y,x+3,y+1,p.roof[2]);line(c,x+3,y+1,x+5,y,p.roof[2]);rect(c,x+2,y+2,3,1,p.roof[1]);}
    }
    line(c,153,63,176,50,p.wood[2]);line(c,176,50,200,31,p.wood[2]);line(c,200,31,225,51,p.wood[2]);line(c,225,51,247,63,p.wood[2]);
    line(c,117,63,124,72,p.wood[3]);line(c,124,72,143,76,p.wood[2]);line(c,143,76,257,76,p.wood[2]);line(c,257,76,278,71,p.wood[2]);line(c,278,71,284,63,p.wood[3]);
    for(let x=129;x<274;x+=5){rect(c,x,73,4,3,p.wood[1]);rect(c,x+1,73,2,1,p.wood[3]);rect(c,x+1,75,2,1,p.wood[0]);}
    poly(c,[[188,54],[192,49],[206,49],[212,55],[209,62],[191,62]],p.wood[0]);for(let i=0;i<5;i++)tooth(c,191+i*4,52+Math.abs(i-2),4,6,p);
    horn(c,123,69,-1,.52,p);horn(c,278,69,1,.5,p);
    // A dark mound, followed by individually shaded bovine skull sprites.
    poly(c,[[107,151],[116,142],[137,140],[158,146],[181,144],[205,149],[230,143],[258,141],[280,146],[292,154],[277,163],[121,164]],p.roof[0]);
    for(let i=0;i<24;i++){const x=111+rand(i+101)*178,y=145+rand(i+142)*14,width=10+Math.round(rand(i+190)*8);skull(c,stamp,x,y,width,i%2===0);}
    for(const [x,y,w,mirror] of ([[123,147,27,false],[148,159,24,true],[253,157,27,true],[277,147,25,false],[172,162,17,false],[228,163,19,true]] as [number,number,number,boolean][]))skull(c,stamp,x,y,w,mirror);
    for(let i=0;i<27;i++){const x=110+rand(i+230)*183,y=155+rand(i+280)*11;rect(c,x,y,2,1,p.bone[i%3]);}
  }
  function backdrop(c: Context,p: Palette,v: number){
    const image=c.createImageData(W,H),colors=p.sky.map(rgb);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      const center=Math.max(0,1-Math.abs(x-200)/240),light=Math.max(0,Math.min(1,(y/165)*.6+center*.4));
      const band=light*1.8,index=Math.min(1,Math.floor(band)),fraction=band-index,threshold=(bayer[(y%4)*4+x%4]+.5)/16;
      const color=colors[Math.min(2,index+(fraction>threshold?1:0))],i=(y*W+x)*4;image.data[i]=color[0];image.data[i+1]=color[1];image.data[i+2]=color[2];image.data[i+3]=255;
    }c.putImageData(image,0,0);
    for(let i=0;i<15;i++){
      const x=Math.floor(rand(i+320)*400),y=Math.floor(rand(i+350)*115),pts: Point[]=[];
      for(let j=-6;j<=6;j++)pts.push([x+j*17,y+Math.round(Math.sin(j*.7+i)*4)]);
      for(let j=1;j<pts.length;j++){line(c,...pts[j-1],...pts[j],p.vein);if(j%3===0)line(c,...pts[j],pts[j][0]+7,pts[j][1]-6,p.sky[1]);}
    }
    if(v===1){
      for(let i=0;i<19;i++){
        const x=Math.floor(rand(i+400)*390);if(x>135&&x<265)continue;
        const width=9+Math.floor(rand(i+420)*20),height=19+Math.floor(rand(i+460)*65),y=p.base;
        poly(c,[[x,y],[x,y-height],[x+4,y-height-4],[x+width-2,y-height+2],[x+width,y]],p.ink);
        for(let yy=y-height+6;yy<y-3;yy+=6)for(let xx=x+2;xx<x+width-1;xx+=4)if(rand(xx+yy)>.28)rect(c,xx,yy,2,1,p.roof[1]);
        line(c,x,y-height+height*.52,x+width,y-height+height*.48,p.vein);
      }
    }
    for(let y=p.base;y<H;y++){
      const index=y>p.base+34?0:1;rect(c,0,y,W,1,p.water[index]);
      if(v!==1&&y<p.base+28&&y%3===0)for(let x=0;x<W;x+=4)if((x+y)%7<3)rect(c,x,y,3,1,p.water[2]);
    }
    for(let i=0;i<40;i++){
      const x=Math.floor(rand(i+500)*400),y=p.base+Math.floor(rand(i+520)*(H-p.base));
      if(v===1){line(c,x,y,x+5,y-2,p.roof[1]);line(c,x+5,y-2,x+10,y,p.water[2]);}
      else rect(c,x,y,4+Math.floor(rand(i+540)*15),1,p.water[i%3===0?2:1]);
    }
  }
  function nearest(r: number,g: number,b: number,colors: number[][]){let best=0,score=Infinity;for(let k=0;k<colors.length;k++){const q=colors[k],d=(q[0]-r)**2+(q[1]-g)**2+(q[2]-b)**2;if(d<score){score=d;best=k;}}return colors[best];}
  function darker(image: HTMLCanvasElement,p: Palette){
    const layer=makeCanvas(),src=image.getContext('2d')!.getImageData(0,0,W,H),out=layer.c.createImageData(W,H),colors=[p.water[0],p.water[1],p.water[2],p.wood[0],p.wood[1],p.roof[0],p.bone[2]].map(rgb);
    for(let i=0;i<src.data.length;i+=4){if(!src.data[i+3])continue;const q=nearest(src.data[i]*.52,src.data[i+1]*.52,src.data[i+2]*.52,colors);out.data[i]=q[0];out.data[i+1]=q[1];out.data[i+2]=q[2];out.data[i+3]=255;}layer.c.putImageData(out,0,0);return layer.image;
  }
  function compose(scene: Scene,t: number){
    const {p,v,wc:c,layers:l}=scene,rise=ease((t-.55)/1.65);c.drawImage(l.back,0,0);
    if(v!==1&&rise>.8){
      for(let y=p.base+6;y<H;y++){
        const sy=Math.round(p.base-(y-p.base-6)/.44);if(sy<0||sy>=H)continue;
        const shift=Math.round(Math.sin(y*.45+t*.8)*(v===2?2:1));c.drawImage(l.reflection,0,sy,W,1,shift,y,W,1);
        if(y%3===0)for(let x=0;x<W;x+=5)if((x+y)%7<4)rect(c,x,y,3,1,p.water[0]);
      }
    }
    if(rise>0)c.drawImage(l.temple,0,Math.round((1-rise)*32));
    for(let i=0;i<17;i++){const cycle=(t*.045+rand(i+600))%1,x=Math.floor(rand(i+630)*400+Math.sin(t*.35+i)*3),y=Math.floor(p.base-cycle*112);if(rise>.5&&cycle>.1&&cycle<.85)rect(c,x,y,1,1,i%4===0?p.wood[2]:p.roof[1]);}
  }
  function slices(c: Context,scene: Scene,t: number){
    const p=scene.p,list=getDomainCuts(t,p),image=scene.wc.getImageData(0,0,W,H),src=new Uint32Array(image.data.buffer),out=scene.out32;out.set(src);
    for(const e of list){
      if(e.age>=e.life*.7)continue;
      const dx=Math.cos(e.angle),dy=Math.sin(e.angle),sx=Math.round(-dy*p.tear),sy=Math.round(dx*p.tear);if(!sx&&!sy)continue;
      const width=5;
      if(Math.abs(dx)>=Math.abs(dy)){
        const a=Math.max(0,Math.ceil(e.x-Math.abs(dx)*e.half)),b=Math.min(W-1,Math.floor(e.x+Math.abs(dx)*e.half));
        for(let x=a;x<=b;x++){const cy=Math.round(e.y+(x-e.x)*dy/dx);for(let k=-width;k<=width;k++){const y=cy+k,xx=x-sx,yy=y-sy;if(y>=0&&y<H&&xx>=0&&xx<W&&yy>=0&&yy<H)out[y*W+x]=src[yy*W+xx];}}
      }else{
        const a=Math.max(0,Math.ceil(e.y-Math.abs(dy)*e.half)),b=Math.min(H-1,Math.floor(e.y+Math.abs(dy)*e.half));
        for(let y=a;y<=b;y++){const cx=Math.round(e.x+(y-e.y)*dx/dy);for(let k=-width;k<=width;k++){const x=cx+k,xx=x-sx,yy=y-sy;if(x>=0&&x<W&&xx>=0&&xx<W&&yy>=0&&yy<H)out[y*W+x]=src[yy*W+xx];}}
      }
    }
    c.putImageData(scene.output,0,0);
    for(const e of list){
      const dx=Math.cos(e.angle),dy=Math.sin(e.angle),nx=-dy,ny=dx;
      for(let j=0;j<e.count;j++){
        const offset=(j-(e.count-1)/2)*5,ax=e.x-dx*e.half+nx*offset,ay=e.y-dy*e.half+ny*offset,bx=e.x+dx*e.half+nx*offset,by=e.y+dy*e.half+ny*offset;
        line(c,ax+nx,ay+ny,bx+nx,by+ny,p.cut);
        line(c,ax,ay,bx,by,e.age<e.life*.65?p.flash:p.bone[2]);
      }
    }
  }
  const stamp=skullSprite(p),full=bake(c=>paintTemple(c,p,stamp));
  const temple=bake(c=>{const width=Math.round(W*p.scale),height=Math.round(H*p.scale),x=Math.round((W-width)/2),y=Math.round(p.base-150*p.scale);c.drawImage(full,x,y,width,height);});
  const world=makeCanvas(),output=world.c.createImageData(W,H);
  const scene={p,v:0,layers:{back:bake(c=>backdrop(c,p,0)),temple,reflection:darker(temple,p)},wc:world.c,output,out32:new Uint32Array(output.data.buffer)};
  type Scene = typeof scene;
  let disposed=false,lastTime=5,spriteCanvas: HTMLCanvasElement | null=null;
  const sprite=new Image();
  const characterColors=['#080b16','#222330','#414153','#686071','#e7e4d4','#b9bdc8','#8899af','#e9b28e','#b57972','#794754','#e5ad9f','#c17d89','#91546e','#b19c6b','#50373e','#75605d'].map(rgb);
  sprite.onload=()=>{
    if(disposed)return;
    const sheet=makeCanvas(272,54),dataContext=sheet.c;
    dataContext.drawImage(sprite,0,0);const data=dataContext.getImageData(0,0,272,54);
    for(let i=0;i<data.data.length;i+=4){
      if(data.data[i+3]<128){data.data[i+3]=0;continue;}
      const q=nearest(data.data[i],data.data[i+1],data.data[i+2],characterColors);
      data.data[i]=q[0];data.data[i+1]=q[1];data.data[i+2]=q[2];data.data[i+3]=255;
    }
    dataContext.putImageData(data,0,0);spriteCanvas=sheet.image;draw(lastTime);
  };
  if(showCharacter)sprite.src='/images/characters/domains/sukuna-idle.png';
  function draw(time: number){
    if(disposed)return;
    lastTime=time;compose(scene,time);slices(c!,scene,time);c!.imageSmoothingEnabled=false;
    if(showCharacter&&spriteCanvas){oval(c!,200,161,17,2,p.ink);c!.drawImage(spriteCanvas,(Math.floor(time*8)%8)*34,0,34,54,183,106,34,54);}
  }
  return {draw,dispose(){disposed=true;sprite.onload=null;}};
}
