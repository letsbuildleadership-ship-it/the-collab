/* Omnidirectional Enterprise Model™ figures (pages/omnidirectional-enterprise.html#figures) */
(function(){
const C={bg:'#0f1d13',fg:'#ff602e',dim:'rgba(255,96,46,0.74)',hair:'rgba(255,96,46,0.34)',f1:'#ff2e12',f2:'#ff6a2e',paper:'#fdf6ec'};
const BR=[
 {n:'Enterprises',l:['Create products.','Generate wealth.','Build solutions.'],co:['Partnership™']},
 {n:'Nonprofits',l:['Address needs.','Create change.','Build stronger','communities.'],co:['The .LLab','Impact™']},
 {n:'Communities',l:['Support people.','Create opportunity.','Drive productivity.'],co:['The Co.LLab','Founders','Organization™']},
 {n:'People',l:['Bring talent.','Build skills.','Create value.'],co:['The .LLab™','Member Portal']},
 {n:'Products & Services',t:['PRODUCTS','& SERVICES'],l:['Every .LLab product.','Shop by phase.','Licensed to keep.'],co:['The .LLab','Products™']},
 {n:'Technology',l:['Amplifies impact.','Connects resources.','Expands access.'],co:['The .LLab Legacy','Ventures™']},
 {n:'Capital',l:['Fuels ideas.','Scales solutions.','Builds legacy.'],co:['The Co.LLab','Founders','Organization™','· Partnership™']},
 {n:'Knowledge + IP',t:['KNOWLEDGE','+ IP'],l:['Sparks innovation.','Builds ownership.','Creates long-term','value.'],co:['The .LLab','R.A.T.™']},
 {n:'Creators',l:['Bring ideas.','Create culture.','Build brands.'],co:['The .LLab','Creators™']}
];
const CUR=[
 {k:1,n:'The Investment Current',d:'Enterprises and Capital → The Source',w:'Partnership investment that powers the system. Every other Current depends on it.'},
 {k:2,n:'The Licensing Current',d:'The Source → Enterprises, through Knowledge + IP and Products & Services',w:'The IV Phases™, the Library Card, the Journal and tier-specific IP.'},
 {k:3,n:'The Living IP Current',d:'Enterprises → Knowledge + IP',w:'Applied use and insight that strengthen the IP as a living document.'},
 {k:4,n:'The Infrastructure Current',d:'The Source → Creators, through Technology',w:'Distribution infrastructure; creators keep authorship of their IP.'},
 {k:5,n:'The Creative Current',d:'Creators → Communities',w:'Quality work: products, IP and community support projects.'},
 {k:6,n:'The Sponsorship Current',d:'Enterprises → Creators and People',w:'Community seats sponsoring outside creators and leaders (coming soon).'},
 {k:7,n:'The Impact Current',d:'The Co.LLab Founders Organization™ (Communities) → Nonprofits',w:'Impact allocation, giving and charity support.'}
];
const TYPES={
 source:{name:'The Source',kind:'Circle · centre',fn:'The Omnidirectional Enterprise Model™. It powers the whole system, owns and licenses the IP, and every substation draws from it.'},
 branch:{name:'Substation',kind:'Circle · substation',fn:'A place where economic activity happens. Each substation exchanges with the Source and with every other substation.'},
 grid:{name:'The Grid',kind:'Circle · the next, larger model',fn:'Every Grid is one circle of a larger Omnidirectional Enterprise™. The same geometry repeats at every scale, without end.'},
 trans:{name:'Transmission line',kind:'Line · Source ↔ substation',fn:'Carries power from the Source out to a substation and carries value back. Two-way.'},
 inter:{name:'Interconnection',kind:'Line · substation ↔ substation, Conductor ↔ Conductor',fn:'Lets two parts exchange directly, without going through the Source. This is what makes the model omnidirectional.'},
 current:{name:'Current',kind:'Line · flow of value',fn:'A flow of value. Currents can run from any circle to any other, in any direction, without end.'},
 badge:{name:'Current marker',kind:'Circle · number',fn:'Marks which Current runs along the line beside it. The key lists every Current.'},
 dist:{name:'Distribution line',kind:'Line · substation → Conductor',fn:'Carries power from a substation out to the Conductors that work in it.'},
 conductor:{name:'Conductor',kind:'Model · an enterprise using the model',fn:'An enterprise using the model: its own Source and 12 substations on the same Omnidirectional Enterprise™ model, connected to every other Conductor.'},
 ent:{name:'Enterprise',kind:'Circle · enterprise',fn:'An enterprise running the same model: its own Source and substations, connected to every other enterprise in the network.'},
 next:{name:'Next generation',kind:'Circle · outer ring',fn:'An enterprise a Conductor serves. Each Conductor runs the same model, so the web keeps growing outward.'},
 nextline:{name:'Next-generation line',kind:'Line · Conductor → next generation',fn:'Carries power from a Conductor to the enterprises, creators and communities it serves.'}
};
const NS='http://www.w3.org/2000/svg';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const rad=d=>d*Math.PI/180;
const P=(cx,cy,r,t)=>[cx+r*Math.cos(t),cy+r*Math.sin(t)];
function trim(x1,y1,x2,y2,d1,d2){const L=Math.hypot(x2-x1,y2-y1),ux=(x2-x1)/L,uy=(y2-y1)/L;return [x1+ux*d1,y1+uy*d1,x2-ux*d2,y2-uy*d2];}
let parts=[]; // {type, name, fn, kind}
function reg(type,extra){const t=TYPES[type];parts.push({type,name:(extra&&extra.name)||t.name,kind:(extra&&extra.kind)||t.kind,fn:(extra&&extra.fn)||t.fn});return parts.length-1;}
const A=i=>rad(-90+40*i);
function ln(x1,y1,x2,y2,st,w,cls,id,extra){return `<line class="oef-part ${cls||''}" data-p="${id}" data-t="${parts[id].type}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${st}" stroke-width="${w}" ${extra||''}/>`;}
function lbl(x,y,txt,ang){let a=ang*180/Math.PI;if(a>90)a-=180;if(a<-90)a+=180;return `<text class="oef-lbl" text-anchor="middle" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)})" dy="3">${esc(txt)}</text>`;}

function ringFig(mode){
 const W=760,H=mode===2?880:770,cx=380,cy=mode===2?395:385,RN=292,rn=57,rc=88;let s='',top='';
 s+=`<rect width="${W}" height="${H}" fill="${C.bg}"/>`;
 s+=`<circle cx="${cx}" cy="${cy}" r="${RN}" fill="none" stroke="rgba(255,96,46,0.18)" stroke-dasharray="2 6"/>`;
 const off=rn/RN+0.05;
 // interconnections (arcs)
 for(let i=0;i<9;i++){const id=reg('inter',{name:`Interconnection · ${BR[i].n} ↔ ${BR[(i+1)%9].n}`,kind:'Line · substation ↔ substation'});
  const [x1,y1]=P(cx,cy,RN,A(i)+off),[x2,y2]=P(cx,cy,RN,A(i+1)-off);
  s+=`<path class="oef-part oef-flow" data-p="${id}" data-t="inter" d="M${x1.toFixed(1)} ${y1.toFixed(1)}A${RN} ${RN} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${C.f2}" stroke-opacity="${mode===2?0.45:0.75}" stroke-width="1.3" marker-start="url(#ah${mode})" marker-end="url(#ah${mode})"/>`;
  const [lx,ly]=P(cx,cy,RN+3,(A(i)+A(i+1))/2);top+=lbl(lx,ly,'INTERCONNECTION',(A(i)+A(i+1))/2+Math.PI/2).replace('class="oef-lbl"','class="oef-lbl" style="font-size:8.5px;letter-spacing:.03em"');}
 // transmission
 for(let i=0;i<9;i++){const id=reg('trans',{name:`Transmission line · Source ↔ ${BR[i].n}`});
  const [x1,y1]=P(cx,cy,rc+8,A(i)),[x2,y2]=P(cx,cy,RN-rn-8,A(i));
  s+=ln(x1,y1,x2,y2,C.f1,1.3,'oef-flow'+(i%2?' oef-rev':''),id,`stroke-opacity="${mode===2?0.55:0.9}" marker-start="url(#ah${mode})" marker-end="url(#ah${mode})"`);
  const [lx,ly]=P(cx,cy,mode===2?rc+52:(rc+RN-rn)/2,A(i));const d=A(i);top+=lbl(lx-9*Math.sin(d),ly+9*Math.cos(d),'TRANSMISSION',d);}
 // currents for fig 2
 if(mode===2){
  const bis=(i,j)=>{const ux=Math.cos(A(i))+Math.cos(A(j)),uy=Math.sin(A(i))+Math.sin(A(j)),h=Math.hypot(ux,uy);return [ux/h,uy/h];};
  const chord=(i,j,c,k)=>{const [bx,by]=bis(i,j),qx=cx+c*bx,qy=cy+c*by;
   const e=(n)=>{const [nx,ny]=P(cx,cy,RN,A(n)),dx=qx-nx,dy=qy-ny,h=Math.hypot(dx,dy);return [nx+(rn+4)*dx/h,ny+(rn+4)*dy/h];};
   const [sx,sy]=e(i),[ex,ey]=e(j),cu=CUR[k-1];
   const id=reg('current',{name:`${cu.n} (${k})`,kind:`Current · ${cu.d}`,fn:cu.w});
   let o=`<path class="oef-part oef-flow" data-p="${id}" data-t="current" d="M${sx.toFixed(1)} ${sy.toFixed(1)}Q${qx.toFixed(1)} ${qy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="${C.paper}" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#cur)"/>`;
   const mx=.25*sx+.5*qx+.25*ex+15*bx,my=.25*sy+.5*qy+.25*ey+15*by;o+=badge(mx,my,k);return o;};
  const badge=(x,y,k)=>{const cu=CUR[k-1];const id=reg('badge',{name:`Current marker ${k} · ${cu.n}`,fn:`${cu.d}. ${cu.w}`});return `<g class="oef-part" data-p="${id}" data-t="badge"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9.5" fill="${C.bg}" stroke="${C.paper}" stroke-width="1.3"/><text x="${x.toFixed(1)}" y="${(y+3.6).toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="700" fill="${C.paper}">${k}</text></g>`;};
  s+=chord(0,7,140,3)+chord(8,2,150,5)+chord(0,8,185,6)+chord(0,3,140,6)+chord(2,1,185,7);
  const sb=(i,side,k)=>{const d=A(i),[x,y]=P(cx,cy,RN-rn-26,d);return badge(x-side*15*Math.sin(d),y+side*15*Math.cos(d),k);};
  s+=sb(0,-1,1)+sb(0,1,2)+sb(6,1,1)+sb(7,1,2)+sb(4,1,2)+sb(5,1,4)+sb(8,1,4);
 }
 // source
 const sid=reg('source');
 s+=`<g class="oef-part" data-p="${sid}" data-t="source"><circle cx="${cx}" cy="${cy}" r="${rc}" fill="${C.bg}" stroke="url(#fil${mode})" stroke-width="1.8"/>
 <text x="${cx}" y="${cy-(mode===2?20:12)}" text-anchor="middle" font-size="17" font-weight="600" fill="${C.fg}">The Source</text>
 <text x="${cx}" y="${cy+(mode===2?2:10)}" text-anchor="middle" font-size="10.5" font-weight="600" letter-spacing="1.5" fill="${C.fg}">OMNIDIRECTIONAL</text>
 <text x="${cx}" y="${cy+(mode===2?16:24)}" text-anchor="middle" font-size="10.5" font-weight="600" letter-spacing="1.5" fill="${C.fg}">ENTERPRISE MODEL™</text>
 ${mode===2?`<text x="${cx}" y="${cy+40}" text-anchor="middle" font-size="12" font-weight="600" fill="${C.paper}">The Co.LLab™</text>`:''}</g>`;
 // substations
 BR.forEach((b,i)=>{const [x,y]=P(cx,cy,RN,A(i));const lines=mode===2?b.co:b.l;const title=b.t||[b.n.toUpperCase()];
  const id=reg('branch',{name:`Substation · ${b.n}`,fn:(mode===2?`Run inside The Co.LLab™ by ${b.co.join(' ')}. `:'')+b.l.join(' ')+' It exchanges with the Source and with the substations beside it.'});
  const n=title.length+lines.length,top=y-((n-1)*14.5)/2-(title.length?6:0)+4;
  let t=`<line x1="${x-14}" y1="${top-17}" x2="${x+14}" y2="${top-17}" stroke="${C.f1}" stroke-width="2"/>`;let yy=top;
  title.forEach(tt=>{t+=`<text x="${x.toFixed(1)}" y="${yy.toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" letter-spacing="1.5" fill="${C.fg}">${esc(tt)}</text>`;yy+=13;});yy+=5;
  lines.forEach(tt=>{t+=`<text x="${x.toFixed(1)}" y="${yy.toFixed(1)}" text-anchor="middle" font-size="10" fill="${C.dim}">${esc(tt)}</text>`;yy+=14.5;});
  s+=`<g class="oef-part" data-p="${id}" data-t="branch"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rn}" fill="${C.bg}" stroke="${C.hair}" stroke-width="1.3"/>${t}</g>`;});
 s+=top;if(mode===2){let y=H-104;s+=`<text x="28" y="${y}" font-size="11" font-weight="700" letter-spacing="1.5" fill="${C.fg}">KEY · THE CURRENTS</text>`;
  CUR.forEach((c,i)=>{const col=i<4?28:400,row=i<4?i:i-4;s+=`<text x="${col}" y="${y+22+row*19}" font-size="11.5" fill="${C.fg}"><tspan font-weight="700" fill="${C.paper}">${c.k}</tspan>  ${esc(c.n.replace('The ',''))}</text>`;});}
 return wrapSvg(W,H,s,mode);
}
function wrapSvg(W,H,s,m){return `<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Figure ${m}" font-family="Inter, Helvetica Neue, Arial, sans-serif"><defs>
 <linearGradient id="fil${m}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.f1}"/><stop offset="1" stop-color="${C.f2}"/></linearGradient>
 <marker id="ah${m}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1L9 5L0 9" fill="none" stroke="${C.f2}" stroke-width="1.4"/></marker>
 <filter id="glow${m}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
 <radialGradient id="sub${m}" cx="50%" cy="38%" r="68%"><stop offset="0" stop-color="#22432b"/><stop offset=".62" stop-color="#132519"/><stop offset="1" stop-color="#ff2e12" stop-opacity=".28"/></radialGradient>
 <radialGradient id="sshade${m}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#0f1d13" stop-opacity=".9"/><stop offset=".85" stop-color="#0f1d13" stop-opacity=".86"/><stop offset="1" stop-color="#ff2e12" stop-opacity=".4"/></radialGradient>
 <radialGradient id="shade${m}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#0f1d13" stop-opacity=".7"/><stop offset=".8" stop-color="#0f1d13" stop-opacity=".84"/><stop offset="1" stop-color="#ff2e12" stop-opacity=".35"/></radialGradient>
 <radialGradient id="core${m}" cx="50%" cy="45%" r="50%"><stop offset="0" stop-color="#ff2e12" stop-opacity=".32"/><stop offset="1" stop-color="#ff2e12" stop-opacity="0"/></radialGradient>
 <marker id="cur" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${C.paper}"/></marker></defs>${s}</svg>`;}

function webFig(){
 const W=760,H=760,cx=380,cy=380,RS=58,R1=135,R2=225,R3=300,rB=9,rC=6,rN=3.2;let s=`<rect width="${W}" height="${H}" fill="${C.bg}"/>`;
 const am=m=>rad(-90+40*Math.floor(m/3)+13*(m%3-1)), aq=q=>am(Math.floor(q/2))+(q%2?1:-1)*0.075;
 const seg=(a,b,da,db,st,w,type,name,cls,op)=>{const id=reg(type,{name});const [x1,y1,x2,y2]=trim(a[0],a[1],b[0],b[1],da,db);return ln(x1,y1,x2,y2,st,w,cls,id,`stroke-opacity="${op||1}"`);};
 const N=i=>P(cx,cy,R1,A(i)),S=m=>P(cx,cy,R2,am(m)),Q=q=>P(cx,cy,R3,aq(q));
 for(let q=0;q<54;q++){const m=Math.floor(q/2);s+=seg(S(m),Q(q),rC+2,rN+2,C.f2,1,'nextline',`Next-generation line · from a ${BR[Math.floor(m/3)].n} Conductor`,'oef-flow',.45);}
 for(let q=0;q<54;q++){s+=seg(Q(q),Q((q+1)%54),rN+2,rN+2,C.paper,.9,'inter','Interconnection · next generation','',.35);}
 for(let m=0;m<27;m++){s+=seg(S(m),S((m+1)%27),rC+2,rC+2,C.paper,1.2,'inter','Interconnection · Conductor ↔ Conductor','oef-flow oef-rev',.7);}
 for(let i=0;i<9;i++){s+=seg(N(i),N((i+1)%9),rB+3,rB+3,C.paper,1.2,'inter',`Interconnection · ${BR[i].n} ↔ ${BR[(i+1)%9].n}`,'',.55);}
 const arc=(m,n,r)=>{const id=reg('inter',{name:'Interconnection · across the web',fn:'Links Conductors in distant substations directly, so value can travel from any point to any other.'});const [a1,b1]=P(cx,cy,R2-rC-2,am(m)),[a2,b2]=P(cx,cy,r,am(m)),[a3,b3]=P(cx,cy,r,am(n)),[a4,b4]=P(cx,cy,R2-rC-2,am(n));
  return `<path class="oef-part oef-flow" data-p="${id}" data-t="inter" d="M${a1.toFixed(1)} ${b1.toFixed(1)}L${a2.toFixed(1)} ${b2.toFixed(1)}A${r} ${r} 0 0 1 ${a3.toFixed(1)} ${b3.toFixed(1)}L${a4.toFixed(1)} ${b4.toFixed(1)}" fill="none" stroke="${C.paper}" stroke-width="1.3" stroke-dasharray="5 4"/>`;};
 s+=arc(2,9,205)+arc(11,18,197)+arc(20,0,189);
 for(let m=0;m<27;m++){s+=seg(N(Math.floor(m/3)),S(m),rB+2,rC+2,C.f2,1.5,'dist',`Distribution line · ${BR[Math.floor(m/3)].n} → Conductor`,'oef-flow',.95);}
 for(let i=0;i<9;i++){const id=reg('trans',{name:`Transmission line · Source ↔ ${BR[i].n}`});const [x1,y1]=P(cx,cy,RS+3,A(i)),[x2,y2]=P(cx,cy,R1-rB-3,A(i));s+=ln(x1,y1,x2,y2,C.f1,1.9,'oef-flow',id);}
 for(let q=0;q<54;q++){const id=reg('next',{name:`Next generation · ${BR[Math.floor(q/6)].n} side`});const [x,y]=Q(q);s+=`<circle class="oef-part" data-p="${id}" data-t="next" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rN}" fill="${C.f2}" fill-opacity=".65"/>`;}
 for(let m=0;m<27;m++){const id=reg('conductor',{name:`Conductor · in ${BR[Math.floor(m/3)].n}`});const [x,y]=S(m);s+=`<circle class="oef-part" data-p="${id}" data-t="conductor" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rC}" fill="${C.f2}"/>`;}
 BR.forEach((b,i)=>{const id=reg('branch',{name:`Substation · ${b.n}`,fn:b.l.join(' ')+' It is tied to the Source, to the substations beside it and to its Conductors.'});const [x,y]=N(i);s+=`<circle class="oef-part" data-p="${id}" data-t="branch" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rB}" fill="${C.bg}" stroke="${C.f2}" stroke-width="2"/>`;});
 const sid=reg('source');s+=`<g class="oef-part" data-p="${sid}" data-t="source"><circle cx="${cx}" cy="${cy}" r="${RS}" fill="${C.bg}" stroke="url(#fil3)" stroke-width="1.8"/><text x="${cx}" y="${cy-10}" text-anchor="middle" font-size="11.5" font-weight="700" letter-spacing="1.5" fill="${C.fg}">THE SOURCE</text><text x="${cx}" y="${cy+8}" text-anchor="middle" font-size="10.5" fill="${C.fg}">Omnidirectional</text><text x="${cx}" y="${cy+22}" text-anchor="middle" font-size="10.5" fill="${C.fg}">Enterprise Model™</text></g>`;
 // substation names
 BR.forEach((b,i)=>{const d=A(i),[x,y]=N(i);let tx=x-15*Math.sin(d),ty=y+15*Math.cos(d)+4,an=-Math.sin(d)>.3?'start':-Math.sin(d)<-.3?'end':'middle';
  if(i===4){tx=x+15;ty=y+4;an='start';} if(i===7){tx=x-15;ty=y+22;an='end';} if(i===2)ty+=6;
  s+=`<text class="oef-lbl" style="font-size:10px;fill:${C.fg}" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${an}">${esc(b.n.toUpperCase())}</text>`;});
 // one direct label per part type
 const L=(x,y,t,an)=>`<text class="oef-lbl" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${an||'start'}">${t}</text>`;
 const [c4x,c4y]=S(4);s+=L(c4x+12,c4y+4,'CONDUCTOR');
 const [q48x,q48y]=P(cx,cy,R3+12,aq(48));s+=L(q48x,q48y,'NEXT GENERATION','end');
 s+=L(cx,cy+212,'INTERCONNECTION','middle');
 const [tx,ty]=P(cx,cy,(RS+R1)/2,A(6));s+=lbl(tx+10,ty+12,'TRANSMISSION',A(6));
 const [dx,dy]=P(cx,cy,(R1+R2)/2,am(6)+.05);s+=L(dx+8,dy-4,'DISTRIBUTION');
 return wrapSvg(W,H,s,3);
}


// Figure 3: many enterprises, each running the same model, joined so value can flow from any circle to any other.
let NET=[]; // circle centres in Figure 3, for the live Currents
// photos from the website inside the circles
const IMGBASE=(()=>{const sc=document.querySelector('script[src*="oe-figures.js"]');return sc?sc.src.replace(/js\/oe-figures\.js.*$/,'assets/img/editorial/'):'../assets/img/editorial/';})();
const PHOTO=['scaffolding','lake','booth','old-faithful','racks','track','arch','road','amber'],SRC_PHOTOS=['storefront','scaffolding','lake','booth','old-faithful','racks','track','arch','road','amber'];
let CLIP=0;
function photoCircle(x,y,r,m,photo,stroke,sw,shade){const id=`cp${m}-${CLIP++}`;
 return `<clipPath id="${id}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"/></clipPath><image href="${IMGBASE}${photo}.jpg" x="${(x-r).toFixed(1)}" y="${(y-r).toFixed(1)}" width="${(2*r).toFixed(1)}" height="${(2*r).toFixed(1)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})" style="filter:grayscale(.35) contrast(1.05)"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="url(#${shade||'shade'}${m})" stroke="${stroke}" stroke-width="${sw}"/>`;}
const CC=(n)=>n*(n-1)/2, NF=(n)=>n.toLocaleString('en-US');

// one whole model, drawn the Figure 3 way: every circle connected to every other circle
// k = scale (1 = Figure 3); m = figure number (marker and gradient ids); opt: {named, src, lines, tag}
function meshAt(e,k,m,opt){opt=opt||{};const RN=232*k,rn=40*k,rc=58*k,pts=BR.map((b,i)=>P(e.x,e.y,RN,A(i)));let o='';
 const op=[0,.85,.6,.45,.35],dash=['','',`${6*k+1} ${4*k+1}`,`${4*k+1} ${4*k+1}`,`${2*k+.8} ${4*k+1}`],sw=Math.max(.5,1.1*k);
 const who=opt.who?` · ${opt.who}`:'';
 for(let st=opt.basic?1:4;st>=1;st--)for(let i=0;i<9;i++){const j=(i+st)%9;const [a1,b1,a2,b2]=trim(pts[i][0],pts[i][1],pts[j][0],pts[j][1],rn+4*k,rn+4*k);
  const id=reg('inter',{name:`Interconnection · ${BR[i].n} ↔ ${BR[j].n}${who}`,kind:st===1?'Line · substation ↔ neighbouring substation':'Line · substation ↔ any substation',fn:'Lets two substations exchange directly, both ways, without going through the Source. Every substation can connect with every other substation.'});
  o+=`<line class="oef-part oef-flow${(i+st)%2?' oef-rev':''}" data-p="${id}" data-t="inter" x1="${a1.toFixed(1)}" y1="${b1.toFixed(1)}" x2="${a2.toFixed(1)}" y2="${b2.toFixed(1)}" stroke="${st===1?C.f2:C.paper}" stroke-opacity="${op[st]}" stroke-width="${(st===1?sw*1.45:sw).toFixed(2)}"${dash[st]?` stroke-dasharray="${dash[st]}"`:''}${st===1?` marker-start="url(#ah${m})" marker-end="url(#ah${m})"`:''}/>`;
  if(opt.lines&&st===1){const ang=Math.atan2(b2-b1,a2-a1),mx=(a1+a2)/2,my=(b1+b2)/2,ox=Math.cos(A(i)+rad(20)),oy=Math.sin(A(i)+rad(20));o+=lbl(mx+ox*13*k,my+oy*13*k,'INTERCONNECTION',ang).replace('class="oef-lbl"','class="oef-lbl" style="font-size:6.3px;letter-spacing:.04em"');}}
 for(let i=0;i<9;i++){const id=reg('trans',{name:`Transmission line · Source ↔ ${BR[i].n}${who}`});const [x1,y1]=P(e.x,e.y,rc+5*k,A(i)),[x2,y2]=P(e.x,e.y,RN-rn-5*k,A(i));
  o+=ln(x1,y1,x2,y2,C.f1,Math.max(.6,1.5*k),'oef-flow'+(i%2?' oef-rev':''),id,`marker-start="url(#ah${m})" marker-end="url(#ah${m})"`);
  if(opt.lines){const [lx,ly]=P(e.x,e.y,(rc+RN-rn)/2+8,A(i)),d=A(i);o+=lbl(lx-8*Math.sin(d),ly+8*Math.cos(d),'TRANSMISSION',d).replace('class="oef-lbl"','class="oef-lbl" style="font-size:8px"');}}
 const src=opt.src||(k>=.9?['The Source','OMNIDIRECTIONAL','ENTERPRISE MODEL™']:k>=.35?['','OMNIDIRECTIONAL','ENTERPRISE']:null);
 const sid=reg(opt.main?'source':'conductor',opt.main?{}:{name:opt.who?`Conductor · ${opt.who}`:'Conductor',fn:'An enterprise using the model: its own Source, substations, Transmission lines and Interconnections, connected to the other enterprises.'});
 const glow=k>=.35;o+=`<g class="oef-part" data-p="${sid}" data-t="${opt.main?'source':'conductor'}">${glow?`<circle cx="${e.x.toFixed(1)}" cy="${e.y.toFixed(1)}" r="${(rc*1.55).toFixed(1)}" fill="url(#core${m})"/><circle cx="${e.x.toFixed(1)}" cy="${e.y.toFixed(1)}" r="${rc.toFixed(1)}" fill="none" stroke="url(#fil${m})" stroke-width="${(2.2*k).toFixed(2)}" filter="url(#glow${m})"/>`:''}${opt.srcPhoto?photoCircle(e.x,e.y,rc,m,opt.srcPhoto,`url(#fil${m})`,Math.max(1,1.8*k).toFixed(2),'sshade'):`<circle cx="${e.x.toFixed(1)}" cy="${e.y.toFixed(1)}" r="${rc.toFixed(1)}" fill="${glow?`url(#sub${m})`:C.bg}" stroke="url(#fil${m})" stroke-width="${Math.max(1,1.8*k).toFixed(2)}"/>`}`;
 if(opt.tags&&k>=.35&&!(src&&src[0]==='The Source'))o+=`<text x="${e.x.toFixed(1)}" y="${(e.y-rc*.52).toFixed(1)}" text-anchor="middle" font-size="${(6.6*k/.93).toFixed(2)}" font-weight="700" letter-spacing="1.2" fill="${C.paper}">${opt.main?'THE SOURCE':'CONDUCTOR'}</text>`;
 if(src){if(src[0])o+=`<text x="${e.x.toFixed(1)}" y="${(e.y-4*k).toFixed(1)}" text-anchor="middle" font-size="${(15*k).toFixed(1)}" font-weight="700" fill="${opt.srcPhoto?C.paper:C.fg}">${src[0]}</text>`;
  o+=`<text x="${e.x.toFixed(1)}" y="${(e.y+(src[0]?13:-1)*k).toFixed(1)}" text-anchor="middle" font-size="${(src[0]?7.6:9)*k}" font-weight="700" letter-spacing="${k}" fill="${opt.srcPhoto?'#ffb08f':C.fg}">${src[1]}</text><text x="${e.x.toFixed(1)}" y="${(e.y+(src[0]?24:11)*k).toFixed(1)}" text-anchor="middle" font-size="${(src[0]?7.6:9)*k}" font-weight="700" letter-spacing="${k}" fill="${opt.srcPhoto?'#ffb08f':C.fg}">${src[2]}</text>`;}
 o+='</g>';
 BR.forEach((b,i)=>{const [x,y]=pts[i];const id=reg('branch',{name:`Substation · ${b.n}${who}`,fn:b.l.join(' ')+' It connects with its Source and with every other substation.'});const t=b.t||[b.n.toUpperCase()];
  o+=`<g class="oef-part" data-p="${id}" data-t="branch">${k>=.35?`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rn.toFixed(1)}" fill="none" stroke="${C.f2}" stroke-opacity=".75" stroke-width="${(1.8*k).toFixed(2)}" filter="url(#glow${m})"/>`:''}${opt.photos?photoCircle(x,y,rn,m,PHOTO[i],C.f2,Math.max(.7,1.6*k).toFixed(2)):`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rn.toFixed(1)}" fill="url(#sub${m})" stroke="${C.f2}" stroke-width="${Math.max(.7,1.6*k).toFixed(2)}"/>`}`;
  if(opt.tags&&k>=.35)o+=`<text x="${x.toFixed(1)}" y="${(y-rn*(opt.co&&b.co.length>3?.66:.5)).toFixed(1)}" text-anchor="middle" font-size="${(5.2*k/.93).toFixed(2)}" font-weight="700" letter-spacing="1" fill="${C.paper}">SUBSTATION</text>`;
  if(opt.co){const lines=b.co.map(tt=>[tt,1]).concat([[b.n.toUpperCase().replace('&AMP;','&'),0]]);lines.forEach(([tt,bold],q)=>{const sp=lines.length>4?8:9.2,fs=lines.length>4?6.9:7.6;o+=`<text x="${x.toFixed(1)}" y="${(y+(lines.length>4?8:6)+(q-(lines.length-1)/2)*sp).toFixed(1)}" text-anchor="middle" font-size="${bold?fs:5.6}" font-weight="700" letter-spacing="${bold?0:.35}" fill="${bold?'#ffd2bf':C.paper}">${esc(tt)}</text>`;});}
  else if(opt.named!==false&&k>=.35)o+=t.map((tt,q)=>`<text x="${x.toFixed(1)}" y="${(y+3*k+(q-(t.length-1)/2)*11*k).toFixed(1)}" text-anchor="middle" font-size="${(8.2*k).toFixed(2)}" font-weight="700" letter-spacing="${k}" fill="${opt.photos?C.paper:C.fg}">${esc(tt)}</text>`).join('');
  o+='</g>';});
 return o;}
// a key of the electrical terms, drawn inside the figure
function keyAt(x,y,items){let o='';items.forEach((it,i)=>{const yy=y+i*17;let sw='';
  if(it.t==='trans')sw=`<line x1="${x}" y1="${yy}" x2="${x+26}" y2="${yy}" stroke="${C.f1}" stroke-width="1.6"/>`;
  else if(it.t==='inter1')sw=`<line x1="${x}" y1="${yy}" x2="${x+26}" y2="${yy}" stroke="${C.f2}" stroke-width="1.6"/>`;
  else if(it.t==='inter')sw=`<line x1="${x}" y1="${yy}" x2="${x+26}" y2="${yy}" stroke="${C.paper}" stroke-width="1.2" stroke-dasharray="4 3" stroke-opacity=".8"/>`;
  else if(it.t==='source')sw=`<circle cx="${x+13}" cy="${yy}" r="6" fill="none" stroke="${C.f1}" stroke-width="1.6"/>`;
  else if(it.t==='branch')sw=`<circle cx="${x+13}" cy="${yy}" r="5" fill="none" stroke="${C.f2}" stroke-width="1.4"/>`;
  else if(it.t==='cond')sw=`<circle cx="${x+13}" cy="${yy}" r="6.5" fill="none" stroke="${C.f2}" stroke-width="1.2"/><circle cx="${x+13}" cy="${yy}" r="2.5" fill="none" stroke="${C.f1}" stroke-width="1.2"/>`;
  o+=sw+`<text x="${x+34}" y="${yy+3.5}" font-size="9"><tspan font-weight="700" letter-spacing=".8" fill="${C.paper}">${it.n}</tspan><tspan fill="${C.dim}"> · ${it.d}</tspan></text>`;});
 return o;}
const T3=(x,y,t)=>`<text class="oef-lbl" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle">${t}</text>`;
// the infinity mark: a lemniscate
function INF(x,y,r){const n=64;let d='';for(let k=0;k<=n;k++){const t=k/n*2*Math.PI,den=1+Math.sin(t)**2,px=x+r*1.9*Math.cos(t)/den,py=y+r*1.9*Math.sin(t)*Math.cos(t)/den;d+=(k?'L':'M')+px.toFixed(1)+' '+py.toFixed(1);}
 return `<path d="${d}Z" fill="none" stroke="${C.paper}" stroke-width="1.8" stroke-linejoin="round"/>`;}
// Figure 1: the basic model
function basicFig(){
 const W=760,H=760;let s=`<rect width="${W}" height="${H}" fill="${C.bg}"/>`;
 s+=meshAt({x:380,y:318},0.93,1,{main:true,lines:true,basic:true,photos:true,tags:true,srcPhoto:'storefront'});
 s+=keyAt(36,606,[{t:'source',n:'THE SOURCE',d:'the model at the centre'},{t:'branch',n:'SUBSTATION',d:'where economic activity happens'}]);
 s+=keyAt(398,606,[{t:'trans',n:'TRANSMISSION LINE',d:'Source ↔ substation, both ways'},{t:'inter1',n:'INTERCONNECTION',d:'substation ↔ neighbouring substation'}]);
 const nS=BR.length;s+=T3(380,722,`1 SOURCE · ${nS} SUBSTATIONS · ${2*nS} TWO-WAY LINES`)+T3(380,740,'POWER GOES OUT ON EVERY LINE, AND VALUE COMES BACK');
 return wrapSvg(W,H,s,1);
}
// Figure 2: the model The Co.LLab runs on, every circle connected with every other circle, with the named Currents
function coFig(){
 const W=760,H=820,cx=380,cy=318,k=.93,RN=232*k,rn=40*k,rc=58*k;let s=`<rect width="${W}" height="${H}" fill="${C.bg}"/>`;
 s+=meshAt({x:cx,y:cy},k,2,{main:true,lines:false,co:true,photos:true,tags:true,srcPhoto:'storefront',src:['The Co.LLab™','OMNIDIRECTIONAL','ENTERPRISE™']});
 const pts=BR.map((b,i)=>P(cx,cy,RN,A(i)));
 const badge=(x,y,n)=>{const cu=CUR[n-1];const id=reg('badge',{name:`Current marker ${n} · ${cu.n}`,fn:`${cu.d}. ${cu.w}`});return `<g class="oef-part" data-p="${id}" data-t="badge"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8.5" fill="${C.bg}" stroke="${C.paper}" stroke-width="1.3"/><text x="${x.toFixed(1)}" y="${(y+3.4).toFixed(1)}" text-anchor="middle" font-size="9.5" font-weight="700" fill="${C.paper}">${n}</text></g>`;};
 const cur=(i,j,n,t)=>{const cu=CUR[n-1];const [a1,b1,a2,b2]=trim(pts[i][0],pts[i][1],pts[j][0],pts[j][1],rn+5,rn+6);const id=reg('current',{name:`${cu.n} (${n})`,kind:`Current · ${cu.d}`,fn:cu.w});
  return `<line class="oef-part oef-flow" data-p="${id}" data-t="current" x1="${a1.toFixed(1)}" y1="${b1.toFixed(1)}" x2="${a2.toFixed(1)}" y2="${b2.toFixed(1)}" stroke="${C.paper}" stroke-width="1.7" marker-end="url(#cur)"/>`+badge(a1+(a2-a1)*t,b1+(b2-b1)*t,n);};
 s+=cur(0,7,3,.3)+cur(8,2,5,.62)+cur(0,8,6,.5)+cur(0,3,6,.35)+cur(2,1,7,.5);
 const sb=(i,side,n)=>{const d=A(i),[x,y]=P(cx,cy,(rc+RN-rn)/2-24,d);return badge(x-side*14*Math.sin(d),y+side*14*Math.cos(d),n);};
 s+=sb(0,-1,1)+sb(0,1,2)+sb(6,1,1)+sb(7,1,2)+sb(4,1,2)+sb(5,1,4)+sb(8,1,4);
 s+=keyAt(36,606,[{t:'source',n:'THE SOURCE',d:'The Co.LLab™, built on the model'},{t:'branch',n:'SUBSTATION',d:'named with the part of The Co.LLab™ that runs it'},{t:'trans',n:'TRANSMISSION LINE',d:'Source ↔ substation, both ways'}]);
 s+=keyAt(398,606,[{t:'inter1',n:'INTERCONNECTION',d:'substation ↔ neighbouring substation'},{t:'inter',n:'INTERCONNECTION',d:'substation ↔ any other substation'}]);
 let y=678;s+=`<text x="36" y="${y}" font-size="9" font-weight="700" letter-spacing="1.2" fill="${C.fg}">CURRENTS · NAMED FLOWS OF VALUE WE RUN TODAY</text>`;
 CUR.forEach((c,i)=>{const col=i<4?36:398,row=i<4?i:i-4;s+=`<text x="${col}" y="${y+19+row*16}" font-size="9.5" fill="${C.fg}"><tspan font-weight="700" fill="${C.paper}">${c.k}</tspan>  ${esc(c.n.replace('The ',''))}</text>`;});
 const nC=BR.length+1;s+=T3(cx,H-26,`${nC} CIRCLES · ${NF(CC(nC))} TWO-WAY CONNECTIONS · ${CUR.length} NAMED CURRENTS`)+T3(cx,H-9,'EVERY CIRCLE CONNECTS WITH EVERY OTHER CIRCLE');
 return wrapSvg(W,H,s,2);
}
// connection lines between two enterprises: their nearest substations, two-way
function joinMesh(e,f,k,m,n,label){const RN=232*k,rn=40*k,br=(g,i)=>P(g.x,g.y,RN,A(i));const c=[];for(let i=0;i<9;i++)for(let j=0;j<9;j++){const [x1,y1]=br(e,i),[x2,y2]=br(f,j);c.push([Math.hypot(x2-x1,y2-y1),i,j]);}c.sort((u,v)=>u[0]-v[0]);
 let o='';const ua=new Set(),ub=new Set();let cnt=0;for(const [d,i,j] of c){if(ua.has(i)||ub.has(j))continue;ua.add(i);ub.add(j);
  const [x1,y1]=br(e,i),[x2,y2]=br(f,j),[a1,b1,a2,b2]=trim(x1,y1,x2,y2,rn+3*k+1,rn+3*k+1);
  const id=reg('inter',{name:'Interconnection · Conductor ↔ Conductor',kind:'Line · between enterprises',fn:'Joins a substation of one enterprise to a substation of another, so they exchange directly, both ways.'});
  o+=`<line class="oef-part oef-flow" data-p="${id}" data-t="inter" x1="${a1.toFixed(1)}" y1="${b1.toFixed(1)}" x2="${a2.toFixed(1)}" y2="${b2.toFixed(1)}" stroke="${C.paper}" stroke-width="${Math.max(.8,1.3*k*2).toFixed(2)}" stroke-opacity=".85" stroke-dasharray="5 4" marker-start="url(#ah${m})" marker-end="url(#ah${m})"/>`;
  if(label&&cnt===0){const ang=Math.atan2(b2-b1,a2-a1);o+=lbl((a1+a2)/2+8*Math.sin(ang),(b1+b2)/2-8*Math.cos(ang),'INTERCONNECTION',ang).replace('class="oef-lbl"','class="oef-lbl" style="font-size:8px"');}
  if(++cnt>=n)break;}
 return o;}
// Figure 3: a few enterprises using the model, interacting
function fewFig(){
 const W=760,H=760,cx=380,cy=312;let s=`<rect width="${W}" height="${H}" fill="${C.bg}"/>`;const k=.43,R=190;
 const ents=[0,1,2].map(q=>{const [x,y]=P(cx,cy,R,rad(-90+120*q));return {x,y};});
 s+=joinMesh(ents[0],ents[1],k,3,3,true)+joinMesh(ents[1],ents[2],k,3,3,false)+joinMesh(ents[2],ents[0],k,3,3,false);
 s+=ents.map((e,q)=>meshAt(e,k,3,{who:['first enterprise','second enterprise','third enterprise'][q],tags:true,srcPhoto:['scaffolding','lake','track'][q],src:['','OMNIDIRECTIONAL','ENTERPRISE']})).join('');
 const [tx,ty]=P(ents[0].x,ents[0].y,232*k+40*k+12,rad(-30));s+=``;
 s+=INF(cx,cy+28,12);
 s+=keyAt(36,612,[{t:'cond',n:'CONDUCTOR',d:'an enterprise using the model'},{t:'trans',n:'TRANSMISSION LINE',d:'inside each enterprise'}]);
 s+=keyAt(398,612,[{t:'inter',n:'INTERCONNECTION',d:'Conductor ↔ Conductor, both ways'},{t:'inter1',n:'INTERCONNECTION',d:'inside each enterprise'}]);
 const n3=3*(BR.length+1);s+=T3(cx,712,`3 CONDUCTORS · ${n3} CIRCLES · UP TO ${NF(CC(n3))} TWO-WAY CONNECTIONS`)+T3(cx,730,`EACH NEW CONDUCTOR ADDS ${BR.length+1} CIRCLES TO THE GRID`);
 return wrapSvg(W,H,s,3);
}
// Figure 4: the Grid: Conductors wired together, each running the whole model
function netFig(){
 const W=760,H=760,cx=380,cy=330;let s=`<rect width="${W}" height="${H}" fill="${C.bg}"/>`;const k=.3,D=212,h3=Math.sqrt(3)/2;
 const ents=[{x:cx,y:cy}];for(let q=0;q<6;q++){const [x,y]=P(cx,cy,D,rad(60*q));ents.push({x,y});}
 for(let a=0;a<ents.length;a++)for(let b=a+1;b<ents.length;b++){const e=ents[a],f=ents[b];if(Math.abs(Math.hypot(e.x-f.x,e.y-f.y)-D)<1)s+=joinMesh(e,f,k,4,2,false);}
 s+=ents.map((e,q)=>meshAt(e,k,4,{named:false,tags:false,srcPhoto:SRC_PHOTOS[q],src:null,who:q?'a Conductor on the Grid':'The Co.LLab™ on the Grid'})).join('');
 ents.forEach((e,q)=>{if(!q)return;const up=e.y<cy-1,ext=232*k+40*k;s+=`<text class="oef-lbl" x="${e.x.toFixed(1)}" y="${(up?e.y-ext-9:e.y+ext+17).toFixed(1)}" text-anchor="middle" style="font-size:8.5px">CONDUCTOR</text>`;});
 s+=keyAt(36,626,[{t:'cond',n:'CONDUCTOR',d:'an enterprise running the whole model'},{t:'inter',n:'INTERCONNECTION',d:'Conductor ↔ Conductor, both ways'}]);
 const nE=ents.length,nCirc=nE*(BR.length+1);
 s+=keyAt(398,626,[{t:'source',n:'THE CO.LLAB™',d:'the Conductor at the centre'},{t:'cond',n:'THE GRID',d:`${nE} Conductors shown, more can join`}]);
 s+=T3(cx,712,`${nE} CONDUCTORS · ${nCirc} CIRCLES · UP TO ${NF(CC(nCirc))} TWO-WAY CONNECTIONS`)+T3(cx,730,'CONNECTIONS GROW FASTER THAN THE GRID: N CIRCLES, N(N−1)/2 CONNECTIONS');
 return wrapSvg(W,H,s,4);
}
function liveCurrents(svg){
 const g=svg.querySelector('.oef-live');if(!g||!NET.length)return;const pts=NET.slice();
 const add=()=>{let a=pts[Math.floor(Math.random()*pts.length)],b=pts[Math.floor(Math.random()*pts.length)];if(a===b)return;
  if(Math.hypot(b[0]-a[0],b[1]-a[1])<40)return;const [x1,y1,x2,y2]=trim(a[0],a[1],b[0],b[1],7,8);
  const pth=document.createElementNS(NS,'path');pth.setAttribute('d',`M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`);pth.setAttribute('class','oef-live-cur');pth.setAttribute('marker-end','url(#cur)');
  g.appendChild(pth);setTimeout(()=>pth.remove(),3200);};
 for(let i=0;i<6;i++)add();
 const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(!reduce)setInterval(()=>{if(svg.classList.contains('oef-flowing'))add();},450);
}
// ---- Metatron's Cube figures (exact geometry: 13 equal circles, centre + six at 2r + six at 4r, 78 lines) ----
// Inner ring = independent (held inside an enterprise); outer ring = external, dependent participants.
const MSLOT=[['o90','Enterprises'],['o30','Partners'],['o330','Nonprofits'],['o270','Communities'],['o210','Members'],['o150','Founders'],['i90','People'],['i30','Knowledge + IP'],['i330','Technology'],['i270','Products & Services'],['i210','Capital'],['i150','Creators']];
const NEWBR={Partners:{n:'Partners',l:['Partnership™'],co:['Partnership™']},Members:{n:'Members',l:['The .LLab','Membership™'],co:['The .LLab','Membership™']},Founders:{n:'Founders',l:['The Co.LLab','Founders','Organization™'],co:['The Co.LLab','Founders','Organization™']}};
const node=n=>BR.find(b=>b.n===n)||NEWBR[n];
function mc(cx,cy,r){const c={core:[cx,cy]};for(let k=0;k<6;k++){const a=(90+60*k)%360,t=rad(a);c['i'+a]=[cx+2*r*Math.cos(t),cy-2*r*Math.sin(t)];c['o'+a]=[cx+4*r*Math.cos(t),cy-4*r*Math.sin(t)];}return c;}
const NAME=Object.fromEntries(MSLOT);NAME.core='The Source';
const HALO=`paint-order="stroke" stroke="${C.bg}" stroke-width="4" stroke-linejoin="round"`;
const MCUR=[[1,'o90','core'],[1,'i210','core'],[2,'core','i30'],[2,'i30','o90'],[3,'o90','i30'],[4,'core','i330'],[4,'i330','i150'],[5,'i150','o270'],[6,'o90','i150'],[6,'o90','i90'],[7,'o270','o330']];
// one small cube (no labels), used for Conductors
function miniCube(x,y,r,o){o=o||{};const c=mc(x,y,r),k=Object.keys(c);let s='';
 for(let i=0;i<13;i++)for(let j=i+1;j<13;j++){const [x1,y1]=c[k[i]],[x2,y2]=c[k[j]];s+=`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;}
 s=`<g stroke="#ffffff" stroke-opacity="${o.op||.82}" stroke-width="${o.lw||1}">${s}</g>`;let cs='';
 k.forEach(n=>{const [cx,cy]=c[n];cs+=`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="none" stroke="${n==='core'?C.f1:C.f2}" stroke-width="${n==='core'?(o.cw||1.2)*1.6:(o.cw||1.2)}"/>`;});
 return s+`<g filter="url(#glow3)">${cs}</g>`;}
function mFig(mode){
 const W=760,H=mode===2?880:770,cx=380,cy=mode===2?378:385,r=62,c=mc(cx,cy,r),keys=Object.keys(c);let s=`<rect width="${W}" height="${H}" fill="${C.bg}"/><circle cx="${cx}" cy="${cy}" r="${2*r}" fill="url(#core${mode})"/>`;
 for(let i=0;i<13;i++)for(let j=i+1;j<13;j++){const a=keys[i],b=keys[j],[x1,y1]=c[a],[x2,y2]=c[b];
  if(a==='core'){const id=reg('trans',{name:`Transmission line · Source ↔ ${NAME[b]}`});s+=ln(x1,y1,x2,y2,'#ffffff',1.6,'oef-flow'+(j%2?' oef-rev':''),id,`stroke-opacity="${mode===2?.6:.85}"`);}
  else{const id=reg('inter',{name:`Interconnection · ${NAME[a]} ↔ ${NAME[b]}`,kind:'Line · substation ↔ substation'});s+=ln(x1,y1,x2,y2,'#ffffff',1.2,'oef-flow'+((i+j)%2?' oef-rev':''),id,`stroke-opacity="${mode===2?.42:.6}"`);}}
 let top='';
 if(mode===2){const seen={},pts=Object.values(c);
  MCUR.forEach(([k,a,b])=>{const key=[a,b].sort().join(),off=8*(seen[key]||0);seen[key]=(seen[key]||0)+1;const [x1,y1]=c[a],[x2,y2]=c[b],L=Math.hypot(x2-x1,y2-y1),ux=(x2-x1)/L,uy=(y2-y1)/L,nx=-uy*off,ny=ux*off;
   const ax=x1+ux*(r+3)+nx,ay=y1+uy*(r+3)+ny,bx=x2-ux*(r+6)+nx,by=y2-uy*(r+6)+ny,cu=CUR[k-1];
   const id=reg('current',{name:`${cu.n} (${k})`,kind:`Current · ${cu.d}`,fn:cu.w});
   s+=`<line class="oef-part oef-flow" data-p="${id}" data-t="current" x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${C.paper}" stroke-width="2.2" marker-end="url(#cur)"/>`;
   let best=null,bd=-1;for(let t=4;t<=16;t++){const m=[ax+(bx-ax)*t/20,ay+(by-ay)*t/20],d=Math.min(...pts.map(p=>Math.hypot(m[0]-p[0],m[1]-p[1])));if(d>bd){bd=d;best=m;}}
   const bid=reg('badge',{name:`Current marker ${k} · ${cu.n}`,fn:`${cu.d}. ${cu.w}`});
   top+=`<g class="oef-part" data-p="${bid}" data-t="badge"><circle cx="${best[0].toFixed(1)}" cy="${best[1].toFixed(1)}" r="9.5" fill="${C.bg}" stroke="${C.paper}" stroke-width="1.4"/><text x="${best[0].toFixed(1)}" y="${(best[1]+3.6).toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="700" fill="${C.paper}">${k}</text></g>`;});}
 const sid=reg('source',mode===2?{name:'The Source · The Co.LLab™'}:undefined);
 s+=`<g class="oef-part" data-p="${sid}" data-t="source"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" pointer-events="visible" stroke="url(#fil${mode})" stroke-width="2.4" filter="url(#glow${mode})"/>
 <text x="${cx}" y="${cy-(mode===2?14:8)}" text-anchor="middle" font-size="15" font-weight="600" fill="${C.paper}" ${HALO}>The Source</text>
 <text x="${cx}" y="${cy+(mode===2?3:9)}" text-anchor="middle" font-size="8.5" font-weight="700" letter-spacing="1.2" fill="${C.fg}" ${HALO}>OMNIDIRECTIONAL</text>
 <text x="${cx}" y="${cy+(mode===2?15:21)}" text-anchor="middle" font-size="8.5" font-weight="700" letter-spacing="1.2" fill="${C.fg}" ${HALO}>ENTERPRISE MODEL™</text>
 ${mode===2?`<text x="${cx}" y="${cy+33}" text-anchor="middle" font-size="11" font-weight="700" fill="${C.paper}" ${HALO}>The Co.LLab™</text>`:''}</g>`;
 MSLOT.forEach(([slot,n])=>{const b=node(n),[x,y]=c[slot],lines=mode===2?b.co:b.l,title=b.t||[b.n.toUpperCase()],ring=slot[0]==='i'?'Inner ring · independent':'Outer ring · external';
  const id=reg('branch',{name:`Substation · ${b.n}`,kind:`Circle · substation · ${ring}`,fn:(mode===2?`Run inside The Co.LLab™ by ${b.co.join(' ')}. `:'')+(b.l||[]).join(' ')+' It exchanges with the Source and with every other substation.'});
  const rows=title.length*12.5+lines.length*12.5+4;let yy=y-rows/2+10,t='';
  title.forEach(tt=>{t+=`<text x="${x.toFixed(1)}" y="${yy.toFixed(1)}" text-anchor="middle" font-size="9.5" font-weight="700" letter-spacing="1.3" fill="${C.fg}" ${HALO}>${esc(tt)}</text>`;yy+=12.5;});yy+=4;
  lines.forEach(tt=>{t+=`<text x="${x.toFixed(1)}" y="${yy.toFixed(1)}" text-anchor="middle" font-size="9.5" fill="${C.paper}" ${HALO}>${esc(tt)}</text>`;yy+=12.5;});
  s+=`<g class="oef-part" data-p="${id}" data-t="branch"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="none" pointer-events="visible" stroke="${C.f2}" stroke-width="1.8" filter="url(#glow${mode})"/>${t}</g>`;});
 s+=top;
 if(mode===2){const y=H-96;s+=`<text x="28" y="${y}" font-size="11" font-weight="700" letter-spacing="1.5" fill="${C.fg}">KEY · THE CURRENTS</text>`;
  CUR.forEach((cu,i)=>{const col=i<4?28:400,row=i<4?i:i-4;s+=`<text x="${col}" y="${y+22+row*19}" font-size="11.5" fill="${C.fg}"><tspan font-weight="700" fill="${C.paper}">${cu.k}</tspan>  ${esc(cu.n.replace('The ',''))}</text>`;});}
 return wrapSvg(W,H,s,mode);}
function connect(spots,cr,w,label){let s='';for(let i=0;i<spots.length;i++)for(let j=i+1;j<spots.length;j++){const [x1,y1,x2,y2]=trim(spots[i][0],spots[i][1],spots[j][0],spots[j][1],cr,cr);
  const id=reg('inter',{name:label,kind:'Line · Conductor ↔ Conductor'});const a=`x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"`;
  s+=`<line class="oef-part" data-p="${id}" data-t="inter" ${a} stroke="#fff" stroke-opacity=".9" stroke-width="${w}"/>`;}
 return s+spots.map(([x,y])=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${cr.toFixed(1)}" fill="none" stroke="#fff" stroke-width="${(w*.6).toFixed(1)}" pointer-events="none"/>`).join('');}
const ICG='<defs><filter id="icg" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter></defs>';
function mFew(){
 const W=760,H=760,cx=380,cy=380,rs=23.5,D=252;const spots=[[cx,cy],...[0,1,2,3,4,5].map(k=>[cx+D*Math.cos(rad(90+60*k)),cy-D*Math.sin(rad(90+60*k))])];
 let s=`<rect width="${W}" height="${H}" fill="${C.bg}"/>${ICG}`;
 spots.forEach(([x,y],i)=>{const id=reg('conductor',{name:i===0?'Conductor · at the centre':'Conductor'});s+=`<g class="oef-part" data-p="${id}" data-t="conductor"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(5*rs).toFixed(1)}" fill="${C.bg}" fill-opacity="0" pointer-events="visible"/>${miniCube(x,y,rs,{lw:1,op:.85,cw:1.3})}</g>`;});
 s+=connect(spots,rs+3,1.6,'Interconnection · Conductor ↔ Conductor');
 const [lx,ly]=spots[4];s+=`<text class="oef-lbl" x="${lx.toFixed(1)}" y="${(ly+5*rs+9).toFixed(1)}" text-anchor="middle">CONDUCTOR</text>`;
 s+=`<text class="oef-lbl" x="${cx}" y="${(cy-D/2+4).toFixed(1)}" text-anchor="middle">INTERCONNECTION</text>`;
 return wrapSvg(W,H,s,3);}
function mGrid(){
 const W=760,H=760,cx=380,cy=380,G=68,big=5*G,pos=mc(cx,cy,G),spots=Object.values(pos);
 let s=`<rect width="${W}" height="${H}" fill="${C.bg}"/>${ICG}<defs><radialGradient id="gfade" cx="50%" cy="50%" r="60%"><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset=".75" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity=".2"/></radialGradient><mask id="gmask"><rect width="${W}" height="${H}" fill="url(#gfade)"/></mask></defs>`;
 const ghosts=[[cx,cy],...[0,1,2,3,4,5].map(k=>[cx+2*big*Math.cos(rad(90+60*k)),cy-2*big*Math.sin(rad(90+60*k))])];
 let g='';ghosts.forEach(([x,y],i)=>{const id=reg('grid',i===0?{name:'The Grid · one circle of the next, larger model'}:{name:'The next Grid'});g+=`<circle class="oef-part" data-p="${id}" data-t="grid" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${big}" fill="none" stroke="${C.paper}" stroke-opacity=".55" stroke-width="2"/>`;});
 for(let i=0;i<7;i++)for(let j=i+1;j<7;j++){g+=`<line x1="${ghosts[i][0].toFixed(1)}" y1="${ghosts[i][1].toFixed(1)}" x2="${ghosts[j][0].toFixed(1)}" y2="${ghosts[j][1].toFixed(1)}" stroke="${C.paper}" stroke-opacity=".35" stroke-width="1.5"/>`;}
 s+=`<g mask="url(#gmask)">${g}</g>`;
 spots.forEach(([x,y],i)=>{const id=reg('conductor',{name:i===0?'The Co.LLab™ · the Conductor at the centre':'Conductor'});s+=`<g class="oef-part" data-p="${id}" data-t="conductor"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${G}" fill="${C.bg}" fill-opacity="0" pointer-events="visible"/>${miniCube(x,y,G/5,{lw:.7,op:.85,cw:.9})}</g>`;});
 s+=connect(spots,G/5+2,1.4,'Interconnection · Conductor ↔ Conductor');
 s+=`<text x="${cx}" y="${cy+4}" text-anchor="middle" font-size="10" font-weight="700" fill="${C.paper}" ${HALO}>The Co.LLab™</text>`;
 s+=`<text class="oef-lbl" x="${cx}" y="${(cy-big-8).toFixed(1)}" text-anchor="middle">THE GRID · ONE CIRCLE OF THE NEXT MODEL</text>`;
 return wrapSvg(W,H,s,4);}

const CAP={
 1:'<b>Figure 1 · Phase I · Foundations.</b> The Omnidirectional Enterprise Model™: the Source at the centre and 12 substations around it, independent ones on the inner ring and external ones on the outer ring. Transmission lines join each substation to the Source; Interconnections join every substation to every other. Every line runs both ways. 1 Source · 12 substations · 78 two-way lines.',
 2:'<b>Figure 2 · Phase II · Infrastructure Planning & Management.</b> The model The Co.LLab™ runs on, with every connection drawn: each circle connects with every other circle, both ways. Each substation names the part of The Co.LLab™ that runs it, and the numbered Currents are the named flows of value we run today. 13 circles · 78 two-way connections · 7 Currents.',
 3:'<b>Figure 3 · Phase III · Internal Operating Systems.</b> Seven Conductors, each a whole copy of the model, every Conductor joined to every other by an Interconnection, both ways. Each new Conductor adds 13 circles. 7 Conductors · 91 circles · up to 4,095 two-way connections.',
 4:'<b>Figure 4 · Phase IV · Preservation.</b> The Grid: 13 Conductors on the 13 circles of a larger Omnidirectional Enterprise™, joined by its 78 lines. The next, larger one fades in at the edges: every Grid is one circle of a larger Omnidirectional Enterprise™, without end. 13 Conductors · 169 circles · up to 14,196 two-way connections.'
};
const roots=[...document.querySelectorAll('.oef-figure[data-fig]')];
if(!roots.length)return;
const ICON={source:`<circle cx="17" cy="10" r="8" fill="none" stroke="${C.f2}" stroke-width="1.8"/>`,branch:`<circle cx="17" cy="10" r="6" fill="none" stroke="${C.hair}" stroke-width="2"/>`,conductor:`<circle cx="17" cy="10" r="5" fill="${C.f2}"/>`,next:`<circle cx="17" cy="10" r="3" fill="${C.f2}" fill-opacity=".65"/>`,trans:`<line x1="3" x2="31" y1="10" y2="10" stroke="${C.f1}" stroke-width="2"/>`,dist:`<line x1="3" x2="31" y1="10" y2="10" stroke="${C.f2}" stroke-width="1.6"/>`,inter:`<line x1="3" x2="31" y1="10" y2="10" stroke="${C.paper}" stroke-width="1.4" stroke-dasharray="5 4"/>`,current:`<line x1="3" x2="31" y1="10" y2="10" stroke="${C.paper}" stroke-width="1.6" stroke-dasharray="5 4"/>`,badge:`<circle cx="17" cy="10" r="8" fill="none" stroke="${C.paper}" stroke-width="1.3"/>`,nextline:`<line x1="3" x2="31" y1="10" y2="10" stroke="${C.f2}" stroke-opacity=".5" stroke-width="1"/>`};
ICON.grid=`<circle cx="17" cy="10" r="8" fill="none" stroke="${C.paper}" stroke-opacity=".6" stroke-width="1.4"/>`;
ICON.conductor=`<circle cx="17" cy="10" r="7" fill="none" stroke="${C.f2}" stroke-width="1.4"/><circle cx="17" cy="10" r="2.6" fill="none" stroke="#fff" stroke-width="1.4"/>`;
ICON.ent=`<circle cx="17" cy="10" r="7" fill="none" stroke="${C.f2}" stroke-width="1.6"/><circle cx="17" cy="10" r="2.5" fill="${C.f2}"/>`;
const flowBox=document.getElementById('oef-flow'),lblBox=document.getElementById('oef-labels');
function mount(root){
 const fig=+root.dataset.fig,q=sel=>root.querySelector(sel);
 const figEl=q('.oef-fig'),partsEl=q('.oef-parts-list'),pKind=q('.oef-kind'),pName=q('.oef-name'),pFn=q('.oef-fn');
 parts=[];figEl.innerHTML=fig===4?mGrid():fig===3?mFew():mFig(fig);const my=parts;q('.oef-caption').innerHTML=CAP[fig];
 const svg=figEl.querySelector('svg');
 const show=p=>{pKind.textContent=p.kind;pName.textContent=p.name;pFn.textContent=p.fn;};
 const hot=(type,idx)=>{svg.classList.toggle('oef-dimmed',!!type);
  svg.querySelectorAll('.oef-part').forEach(e=>e.classList.toggle('oef-hot',idx!=null?+e.dataset.p===idx:e.dataset.t===type));
  partsEl.querySelectorAll('.oef-row').forEach(r=>r.classList.toggle('oef-on',r.dataset.t===type));};
 const types=[...new Set(my.map(p=>p.type))];
 partsEl.innerHTML=types.map(t=>`<div class="oef-row" tabindex="0" role="button" data-t="${t}"><svg viewBox="0 0 34 20" aria-hidden="true">${ICON[t]||''}</svg><div><b>${TYPES[t].name}${t==='current'?'s':''}</b><span>${TYPES[t].fn}</span></div></div>`).join('')+
  (fig===2?CUR.map(c=>`<div class="oef-row" tabindex="0" role="button" data-t="current"><svg viewBox="0 0 34 20" aria-hidden="true"><circle cx="17" cy="10" r="8" fill="none" stroke="${C.paper}"/><text x="17" y="13.5" text-anchor="middle" font-size="10" font-weight="700" fill="${C.paper}">${c.k}</text></svg><div><b>${c.n}</b><span>${c.d}. ${c.w}</span></div></div>`).join(''):'');
 show({kind:TYPES.source.kind,name:'The Source',fn:TYPES.source.fn});
 svg.addEventListener('mouseover',e=>{const g=e.target.closest('.oef-part');if(!g)return;const i=+g.dataset.p;show(my[i]);hot(my[i].type,i);});
 svg.addEventListener('mouseleave',()=>hot(null));
 svg.addEventListener('click',e=>{const g=e.target.closest('.oef-part');if(!g){hot(null);return;}const i=+g.dataset.p;show(my[i]);hot(my[i].type,i);});
 partsEl.querySelectorAll('.oef-row').forEach(r=>{const go=()=>{const t=r.dataset.t;show({kind:TYPES[t].kind,name:r.querySelector('b').textContent,fn:r.querySelector('span').textContent});hot(t);};r.addEventListener('mouseenter',go);r.addEventListener('click',go);r.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});});
}
roots.forEach(mount);
const apply=()=>document.querySelectorAll('.oef-figure .oef-fig svg').forEach(svg=>{svg.classList.toggle('oef-flowing',!flowBox||flowBox.checked);svg.classList.toggle('oef-hide-labels',!!lblBox&&!lblBox.checked);});
if(flowBox)flowBox.addEventListener('change',apply);
if(lblBox)lblBox.addEventListener('change',apply);
apply();
})();
