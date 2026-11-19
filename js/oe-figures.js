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
 source:{name:'The Source',kind:'Circle · centre',fn:'The Omnidirectional Enterprise Model™. It powers the whole system, owns and licenses the IP, and every branch draws from it.'},
 branch:{name:'Branch',kind:'Circle · branch',fn:'A place where economic activity happens. Each branch exchanges with the Source and with the branches beside it.'},
 trans:{name:'Transmission line',kind:'Line · Source ↔ branch',fn:'Carries power from the Source out to a branch and carries value back. Two-way.'},
 inter:{name:'Interconnection',kind:'Line · branch ↔ branch, Conductor ↔ Conductor',fn:'Lets two parts exchange directly, without going through the Source. This is what makes the model omnidirectional.'},
 current:{name:'Current',kind:'Line · flow of value',fn:'A flow of value. Currents can run from any circle to any other, in any direction, without end.'},
 badge:{name:'Current marker',kind:'Circle · number',fn:'Marks which Current runs along the line beside it. The key lists every Current.'},
 dist:{name:'Distribution line',kind:'Line · branch → Conductor',fn:'Carries power from a branch out to the Conductors that work in it.'},
 conductor:{name:'Conductor',kind:'Circle · participating enterprise',fn:'A participating enterprise. It takes in the IP, applies it to what it already does best and returns value to the system.'},
 ent:{name:'Enterprise',kind:'Circle · enterprise',fn:'An enterprise running the same model: its own Source and branches, connected to every other enterprise in the network.'},
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
 for(let i=0;i<9;i++){const id=reg('inter',{name:`Interconnection · ${BR[i].n} ↔ ${BR[(i+1)%9].n}`,kind:'Line · branch ↔ branch'});
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
 // branches
 BR.forEach((b,i)=>{const [x,y]=P(cx,cy,RN,A(i));const lines=mode===2?b.co:b.l;const title=b.t||[b.n.toUpperCase()];
  const id=reg('branch',{name:`Branch · ${b.n}`,fn:(mode===2?`Run inside The Co.LLab™ by ${b.co.join(' ')}. `:'')+b.l.join(' ')+' It exchanges with the Source and with the branches beside it.'});
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
 const arc=(m,n,r)=>{const id=reg('inter',{name:'Interconnection · across the web',fn:'Links Conductors in distant branches directly, so value can travel from any point to any other.'});const [a1,b1]=P(cx,cy,R2-rC-2,am(m)),[a2,b2]=P(cx,cy,r,am(m)),[a3,b3]=P(cx,cy,r,am(n)),[a4,b4]=P(cx,cy,R2-rC-2,am(n));
  return `<path class="oef-part oef-flow" data-p="${id}" data-t="inter" d="M${a1.toFixed(1)} ${b1.toFixed(1)}L${a2.toFixed(1)} ${b2.toFixed(1)}A${r} ${r} 0 0 1 ${a3.toFixed(1)} ${b3.toFixed(1)}L${a4.toFixed(1)} ${b4.toFixed(1)}" fill="none" stroke="${C.paper}" stroke-width="1.3" stroke-dasharray="5 4"/>`;};
 s+=arc(2,9,205)+arc(11,18,197)+arc(20,0,189);
 for(let m=0;m<27;m++){s+=seg(N(Math.floor(m/3)),S(m),rB+2,rC+2,C.f2,1.5,'dist',`Distribution line · ${BR[Math.floor(m/3)].n} → Conductor`,'oef-flow',.95);}
 for(let i=0;i<9;i++){const id=reg('trans',{name:`Transmission line · Source ↔ ${BR[i].n}`});const [x1,y1]=P(cx,cy,RS+3,A(i)),[x2,y2]=P(cx,cy,R1-rB-3,A(i));s+=ln(x1,y1,x2,y2,C.f1,1.9,'oef-flow',id);}
 for(let q=0;q<54;q++){const id=reg('next',{name:`Next generation · ${BR[Math.floor(q/6)].n} side`});const [x,y]=Q(q);s+=`<circle class="oef-part" data-p="${id}" data-t="next" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rN}" fill="${C.f2}" fill-opacity=".65"/>`;}
 for(let m=0;m<27;m++){const id=reg('conductor',{name:`Conductor · in ${BR[Math.floor(m/3)].n}`});const [x,y]=S(m);s+=`<circle class="oef-part" data-p="${id}" data-t="conductor" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rC}" fill="${C.f2}"/>`;}
 BR.forEach((b,i)=>{const id=reg('branch',{name:`Branch · ${b.n}`,fn:b.l.join(' ')+' It is tied to the Source, to the branches beside it and to its Conductors.'});const [x,y]=N(i);s+=`<circle class="oef-part" data-p="${id}" data-t="branch" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rB}" fill="${C.bg}" stroke="${C.f2}" stroke-width="2"/>`;});
 const sid=reg('source');s+=`<g class="oef-part" data-p="${sid}" data-t="source"><circle cx="${cx}" cy="${cy}" r="${RS}" fill="${C.bg}" stroke="url(#fil3)" stroke-width="1.8"/><text x="${cx}" y="${cy-10}" text-anchor="middle" font-size="11.5" font-weight="700" letter-spacing="1.5" fill="${C.fg}">THE SOURCE</text><text x="${cx}" y="${cy+8}" text-anchor="middle" font-size="10.5" fill="${C.fg}">Omnidirectional</text><text x="${cx}" y="${cy+22}" text-anchor="middle" font-size="10.5" fill="${C.fg}">Enterprise Model™</text></g>`;
 // branch names
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
function meshFig(){
 // every circle connects to every other circle, and every line runs on, in every direction
 const W=760,H=760,cx=380,cy=352,RN=232,rn=40,rc=58;let s=`<rect width="${W}" height="${H}" fill="${C.bg}"/>`;
 s+=`<defs></defs>`;
 const pts=BR.map((b,i)=>P(cx,cy,RN,A(i)));
 // every branch to every branch, two-way; the steps around the nonagon form its star polygons
 const op=[0,.85,.6,.45,.35],dash=['','','6 4','4 4','2 4'];
 for(let k=4;k>=1;k--)for(let i=0;i<9;i++){const j=(i+k)%9;const [a1,b1,a2,b2]=trim(pts[i][0],pts[i][1],pts[j][0],pts[j][1],rn+4,rn+4);
  const id=reg('inter',{name:`Interconnection · ${BR[i].n} ↔ ${BR[j].n}`,kind:'Line · any circle ↔ any circle',fn:'Every circle can connect directly with every other circle, in both directions. The lines run on past the figure, in every direction.'});
  s+=`<line class="oef-part oef-flow${(i+k)%2?' oef-rev':''}" data-p="${id}" data-t="inter" x1="${a1.toFixed(1)}" y1="${b1.toFixed(1)}" x2="${a2.toFixed(1)}" y2="${b2.toFixed(1)}" stroke="${k===1?C.f2:C.paper}" stroke-opacity="${op[k]}" stroke-width="${k===1?1.6:1.1}"${dash[k]?` stroke-dasharray="${dash[k]}"`:''}${k===1?' marker-start="url(#ah3)" marker-end="url(#ah3)"':''}/>`;}
 // the Source to every branch
 for(let i=0;i<9;i++){const id=reg('trans',{name:`Transmission line · Source ↔ ${BR[i].n}`});const [x1,y1]=P(cx,cy,rc+5,A(i)),[x2,y2]=P(cx,cy,RN-rn-5,A(i));s+=ln(x1,y1,x2,y2,C.f1,1.5,'oef-flow'+(i%2?' oef-rev':''),id,'marker-start="url(#ah3)" marker-end="url(#ah3)"');}
 const sid=reg('source');s+=`<g class="oef-part" data-p="${sid}" data-t="source"><circle cx="${cx}" cy="${cy}" r="${rc}" fill="${C.bg}" stroke="url(#fil3)" stroke-width="1.8"/><text x="${cx}" y="${cy-6}" text-anchor="middle" font-size="13" font-weight="600" fill="${C.fg}">The Source</text><text x="${cx}" y="${cy+10}" text-anchor="middle" font-size="7" font-weight="600" letter-spacing="1" fill="${C.fg}">OMNIDIRECTIONAL</text><text x="${cx}" y="${cy+20}" text-anchor="middle" font-size="7" font-weight="600" letter-spacing="1" fill="${C.fg}">ENTERPRISE MODEL™</text></g>`;
 BR.forEach((b,i)=>{const [x,y]=pts[i];const id=reg('branch',{name:`Branch · ${b.n}`,fn:b.l.join(' ')+' It can connect directly with every other circle.'});const t=b.t||[b.n.toUpperCase()];
  s+=`<g class="oef-part" data-p="${id}" data-t="branch"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rn}" fill="${C.bg}" stroke="${C.f2}" stroke-width="1.6"/>${t.map((tt,k)=>`<text x="${x.toFixed(1)}" y="${(y+3+(k-(t.length-1)/2)*11).toFixed(1)}" text-anchor="middle" font-size="8.2" font-weight="700" letter-spacing="1" fill="${C.fg}">${esc(tt)}</text>`).join('')}</g>`;});
 const T=(x,y,t)=>`<text class="oef-lbl" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle">${t}</text>`;
 s+=INF(cx,H-58,14)+T(cx,H-26,'EVERY CIRCLE CONNECTS WITH EVERY OTHER CIRCLE')+T(cx,H-9,'IN EVERY DIRECTION, WITHOUT END');
 return wrapSvg(W,H,s,3);
}
// the infinity mark: a lemniscate
function INF(x,y,r){const n=64;let d='';for(let k=0;k<=n;k++){const t=k/n*2*Math.PI,den=1+Math.sin(t)**2,px=x+r*1.9*Math.cos(t)/den,py=y+r*1.9*Math.sin(t)*Math.cos(t)/den;d+=(k?'L':'M')+px.toFixed(1)+' '+py.toFixed(1);}
 return `<path d="${d}Z" fill="none" stroke="${C.paper}" stroke-width="1.8" stroke-linejoin="round"/>`;}
// one whole Omnidirectional Enterprise at scale k, centred on (x,y)
function modelAt(e,k,m,named){const RN=84*k,RB=20*k,RC=25*k;let o='';const tag=named?1:0;
 o+=`<circle cx="${e.x.toFixed(1)}" cy="${e.y.toFixed(1)}" r="${RN.toFixed(1)}" fill="none" stroke="rgba(255,96,46,0.2)" stroke-dasharray="2 5"/>`;
 const off=RB/RN+0.06,sw=Math.max(.6,1.1*k);
 for(let i=0;i<9;i++){const [x1,y1]=P(e.x,e.y,RN,A(i)+off),[x2,y2]=P(e.x,e.y,RN,A(i+1)-off);const id=reg('inter',{name:`Interconnection · ${BR[i].n} ↔ ${BR[(i+1)%9].n}`,kind:'Line · branch ↔ branch'});
  o+=`<path class="oef-part oef-flow" data-p="${id}" data-t="inter" d="M${x1.toFixed(1)} ${y1.toFixed(1)}A${RN.toFixed(1)} ${RN.toFixed(1)} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${C.f2}" stroke-opacity=".8" stroke-width="${sw.toFixed(2)}" marker-start="url(#ah${m})" marker-end="url(#ah${m})"/>`;}
 for(let i=0;i<9;i++){const [x1,y1]=P(e.x,e.y,RC+4*k,A(i)),[x2,y2]=P(e.x,e.y,RN-RB-4*k,A(i));const id=reg('trans',{name:`Transmission line · Source ↔ ${BR[i].n}`});
  o+=ln(x1,y1,x2,y2,C.f1,sw,'oef-flow'+(i%2?' oef-rev':''),id,`marker-start="url(#ah${m})" marker-end="url(#ah${m})"`);}
 for(let i=0;i<9;i++){const [x,y]=P(e.x,e.y,RN,A(i));const id=reg('branch',{name:`Branch · ${BR[i].n}`,fn:BR[i].l.join(' ')+' It connects to its Source, to the branches beside it, and to branches of other enterprises.'});
  o+=`<circle class="oef-part" data-p="${id}" data-t="branch" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${RB.toFixed(1)}" fill="${C.bg}" stroke="${C.f2}" stroke-width="${Math.max(.8,1.4*k).toFixed(2)}"/>`;
  if(named)o+=`<text x="${x.toFixed(1)}" y="${(y+2.2*k).toFixed(1)}" text-anchor="middle" font-size="${(4.6*k).toFixed(2)}" font-weight="700" letter-spacing=".2" fill="${C.fg}" pointer-events="none">${esc(BR[i].t?BR[i].t[0]:BR[i].n.toUpperCase())}</text>`;}
 const id=reg('ent',{name:e.name||'An Omnidirectional Enterprise',kind:'Circle · an enterprise’s Source',fn:'A whole Omnidirectional Enterprise: its own Source, branches and connector lines, connected to the enterprises around it.'});
 o+=`<g class="oef-part" data-p="${id}" data-t="ent"><circle cx="${e.x.toFixed(1)}" cy="${e.y.toFixed(1)}" r="${RC.toFixed(1)}" fill="${C.bg}" stroke="url(#fil${m})" stroke-width="${Math.max(1,1.6*k).toFixed(2)}"/>${named?`<text x="${e.x.toFixed(1)}" y="${(e.y-1*k).toFixed(1)}" text-anchor="middle" font-size="${(4.9*k).toFixed(2)}" font-weight="700" letter-spacing=".2" fill="${C.fg}">OMNIDIRECTIONAL</text><text x="${e.x.toFixed(1)}" y="${(e.y+7*k).toFixed(1)}" text-anchor="middle" font-size="${(4.9*k).toFixed(2)}" font-weight="700" letter-spacing=".2" fill="${C.fg}">ENTERPRISE</text>`:''}</g>`;
 return o;}
// connection lines between two enterprises: their nearest branches, two-way
function joinEnts(e,f,k,m,n){const RN=84*k,RB=20*k,br=(g,i)=>P(g.x,g.y,RN,A(i));const c=[];for(let i=0;i<9;i++)for(let j=0;j<9;j++){const [x1,y1]=br(e,i),[x2,y2]=br(f,j);c.push([Math.hypot(x2-x1,y2-y1),i,j]);}c.sort((u,v)=>u[0]-v[0]);
 let o='';const ua=new Set(),ub=new Set();let cnt=0;for(const [d,i,j] of c){if(ua.has(i)||ub.has(j))continue;ua.add(i);ub.add(j);
  const [x1,y1]=br(e,i),[x2,y2]=br(f,j),[a1,b1,a2,b2]=trim(x1,y1,x2,y2,RB+3*k,RB+3*k);
  const id=reg('inter',{name:'Interconnection · enterprise ↔ enterprise',kind:'Line · between enterprises',fn:'Joins a branch of one Omnidirectional Enterprise to a branch of another, so they exchange directly, both ways.'});
  o+=`<line class="oef-part oef-flow" data-p="${id}" data-t="inter" x1="${a1.toFixed(1)}" y1="${b1.toFixed(1)}" x2="${a2.toFixed(1)}" y2="${b2.toFixed(1)}" stroke="${C.paper}" stroke-width="${Math.max(.7,1.2*k).toFixed(2)}" stroke-opacity=".8" stroke-dasharray="4 4" marker-start="url(#ah${m})" marker-end="url(#ah${m})"/>`;if(++cnt>=n)break;}
 return o;}
// Figure 4: a few enterprises, each running the whole model, interacting
function fewFig(){
 const W=760,H=760,cx=380,cy=350;let s=`<rect width="${W}" height="${H}" fill="${C.bg}"/>`;const k=1.18,R=200;
 const ents=[0,1,2].map(q=>{const [x,y]=P(cx,cy,R,rad(-90+120*q));return {x,y,name:q===0?'An Omnidirectional Enterprise':'Another Omnidirectional Enterprise'};});
 s+=joinEnts(ents[0],ents[1],k,4,3)+joinEnts(ents[1],ents[2],k,4,3)+joinEnts(ents[2],ents[0],k,4,3);
 s+=ents.map(e=>modelAt(e,k,4,true)).join('');
 const T=(x,y,t)=>`<text class="oef-lbl" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle">${t}</text>`;
 s+=INF(cx,cy+16,13)+T(cx,H-26,'A FEW ENTERPRISES, EACH RUNNING THE WHOLE MODEL')+T(cx,H-9,'INTERACTING BRANCH TO BRANCH, BOTH WAYS');
 return wrapSvg(W,H,s,4);
}
// Figure 5: a much expanded network, inside the frame
function netFig(){
 const W=760,H=760,cx=380,cy=360;let s=`<rect width="${W}" height="${H}" fill="${C.bg}"/>`;const k=.5,D=128,h3=Math.sqrt(3)/2;
 const ents=[];for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++){const x=cx+D*(i+j/2),y=cy+D*h3*j,r=Math.hypot(x-cx,y-cy);if(r<=2*D+1)ents.push({x,y});}
 for(let a=0;a<ents.length;a++)for(let b=a+1;b<ents.length;b++){const e=ents[a],f=ents[b];if(Math.abs(Math.hypot(e.x-f.x,e.y-f.y)-D)<1)s+=joinEnts(e,f,k,5,2);}
 s+=ents.map(e=>modelAt(e,k,5,false)).join('');
 const T=(x,y,t)=>`<text class="oef-lbl" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle">${t}</text>`;
 s+=INF(cx,H-58,14)+T(cx,H-26,'A MUCH EXPANDED NETWORK OF OMNIDIRECTIONAL ENTERPRISES')+T(cx,H-9,'CONNECTED IN EVERY DIRECTION, WITHOUT END');
 return wrapSvg(W,H,s,5);
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
const CAP={
 1:'<b>Figure 1. The model.</b> The Source at the centre and branches around it. Transmission lines join each branch to the Source; interconnections join each branch to the branches beside it.',
 2:'<b>Figure 2. The blueprint.</b> One enterprise: the same branches, each showing the part of The Co.LLab™ that runs it. Numbered markers and cream arrows show the named Currents we run today. Currents are not fixed to these routes: value can flow from any circle to any other.',
 3:'<b>Figure 3. Every direction.</b> The model in Figure 1 with every possible connection drawn. Each circle connects with every other circle, in both directions; the steps around the circle form its star shapes.',
 4:'<b>Figure 4. A few enterprises.</b> Three Omnidirectional Enterprises, each a whole copy of the model, interacting branch to branch, both ways.',
 5:'<b>Figure 5. The network.</b> A much expanded network: many Omnidirectional Enterprises, each running the whole model, each connected to the enterprises around it. The infinity mark stands for what this view cannot hold: the network continues without end.'
};
const roots=[...document.querySelectorAll('.oef-figure[data-fig]')];
if(!roots.length)return;
const ICON={source:`<circle cx="17" cy="10" r="8" fill="none" stroke="${C.f2}" stroke-width="1.8"/>`,branch:`<circle cx="17" cy="10" r="6" fill="none" stroke="${C.hair}" stroke-width="2"/>`,conductor:`<circle cx="17" cy="10" r="5" fill="${C.f2}"/>`,next:`<circle cx="17" cy="10" r="3" fill="${C.f2}" fill-opacity=".65"/>`,trans:`<line x1="3" x2="31" y1="10" y2="10" stroke="${C.f1}" stroke-width="2"/>`,dist:`<line x1="3" x2="31" y1="10" y2="10" stroke="${C.f2}" stroke-width="1.6"/>`,inter:`<line x1="3" x2="31" y1="10" y2="10" stroke="${C.paper}" stroke-width="1.4" stroke-dasharray="5 4"/>`,current:`<line x1="3" x2="31" y1="10" y2="10" stroke="${C.paper}" stroke-width="1.6" stroke-dasharray="5 4"/>`,badge:`<circle cx="17" cy="10" r="8" fill="none" stroke="${C.paper}" stroke-width="1.3"/>`,nextline:`<line x1="3" x2="31" y1="10" y2="10" stroke="${C.f2}" stroke-opacity=".5" stroke-width="1"/>`};
ICON.ent=`<circle cx="17" cy="10" r="7" fill="none" stroke="${C.f2}" stroke-width="1.6"/><circle cx="17" cy="10" r="2.5" fill="${C.f2}"/>`;
const flowBox=document.getElementById('oef-flow'),lblBox=document.getElementById('oef-labels');
function mount(root){
 const fig=+root.dataset.fig,q=sel=>root.querySelector(sel);
 const figEl=q('.oef-fig'),partsEl=q('.oef-parts-list'),pKind=q('.oef-kind'),pName=q('.oef-name'),pFn=q('.oef-fn');
 parts=[];figEl.innerHTML=fig===5?netFig():fig===4?fewFig():fig===3?meshFig():ringFig(fig);const my=parts;q('.oef-caption').innerHTML=CAP[fig];
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
