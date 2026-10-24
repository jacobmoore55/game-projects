(() => {
  'use strict';
  const SIZE = 8, ROUND_MS = 60000, MIN_WORDS = 40;
  const $ = id => document.getElementById(id);
  const lexicon = new Set((window.WORD_LAPSE_DICTIONARY || '').toLowerCase().split(/\s+/).filter(Boolean));
  // Build seed candidates from the loaded dictionary; no separate seed file is required.
  const seedWords = (window.WORD_LAPSE_SEEDS?.length
    ? window.WORD_LAPSE_SEEDS
    : [...lexicon].filter(w => /^[a-z]{3,6}$/.test(w)))
    .map(w => w.toUpperCase());
  const dirs = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
  const letterPool = 'EEEEEEEEEEEEAAAAAAAAAIIIIIIIIOOOOOOOONNNNNNRRRRRRTTTTTTLLLLSSSSUUUUDDDDGGGBBCCMMPPFFHHVVWWYYKJXQZ';
  const rand = n => Math.floor(Math.random() * n);
  const at = (r,c) => r*SIZE+c;
  const inside = (r,c) => r>=0 && r<SIZE && c>=0 && c<SIZE;
  const randomLetter = () => letterPool[rand(letterPool.length)];
  let grid=[], validWords=new Set(), found=new Map(), marks=Array.from({length:64},()=>[]);
  let playing=false, dragging=false, pointerId=null, startIndex=-1, selection=[], deadline=0, ticker=null, best=0;
  let lastPointer=null, lastValidSelection=[];
  let geometry=null, activeLine=null;
  try { best = Number(localStorage.getItem('wordlapse-best') || 0) || 0; } catch (_) {}
  $('best').textContent=best;
  const color = () => `hsl(${rand(360)} 82% 73%)`;

  function candidate(grid, word, r, c, dr, dc) {
    let overlap=0, empty=0;
    for(let k=0;k<word.length;k++) {
      const rr=r+k*dr, cc=c+k*dc;
      if(!inside(rr,cc))return -1;
      const x=grid[at(rr,cc)];
      if(x && x!==word[k])return -1;
      if(x)overlap++; else empty++;
    }
    return empty===0 ? -1 : overlap*4+Math.min(empty,4);
  }
  function placeWord(grid,word) {
    let options=[], bestScore=-1;
    for(let trial=0;trial<36;trial++) {
      const [dr,dc]=dirs[rand(8)],r=rand(8),c=rand(8);
      const score=candidate(grid,word,r,c,dr,dc);
      if(score<0)continue;
      if(score>bestScore){bestScore=score;options=[[r,c,dr,dc]];}
      else if(score===bestScore)options.push([r,c,dr,dc]);
    }
    if(!options.length)return false;
    const [r,c,dr,dc]=options[rand(options.length)];
    for(let k=0;k<word.length;k++)grid[at(r+k*dr,c+k*dc)]=word[k];
    return true;
  }
  // Scan every contiguous 2–8-letter straight line, in all eight directions.
  function solve(board) {
    const results=new Set();
    for(let r=0;r<8;r++)for(let c=0;c<8;c++)for(const [dr,dc] of dirs){
      let w='';
      for(let k=0;k<8;k++){
        const rr=r+k*dr,cc=c+k*dc;
        if(!inside(rr,cc))break;
        w+=board[at(rr,cc)];
        if(k>=1&&lexicon.has(w.toLowerCase()))results.add(w.toLowerCase());
      }
    }
    return results;
  }
  function makeBoard() {
    let bestBoard=null,bestSet=null;
    for(let attempt=0;attempt<24;attempt++){
      const b=Array(64).fill('');
      const used=new Set();
      // Favor 3–5-letter seeds; 6-letter words appear occasionally.
      for(let k=0;k<65;k++){
        let w;
        for(let j=0;j<8;j++){
          const v=seedWords[rand(seedWords.length)];
          if(!used.has(v)&&(v.length<=5||Math.random()<.15)){w=v;break;}
        }
        if(w && placeWord(b,w))used.add(w);
      }
      for(let i=0;i<64;i++)if(!b[i])b[i]=randomLetter();
      const all=solve(b);
      if(!bestSet||all.size>bestSet.size){bestBoard=b;bestSet=all;}
      if(all.size>=MIN_WORDS)return {board:b,all};
    }
    return {board:bestBoard,all:bestSet};
  }
  function drawBoard(){
    const el=$('board');el.replaceChildren();
    grid.forEach((letter,i)=>{
      const tile=document.createElement('div');tile.className='tile';tile.dataset.index=i;
      const span=document.createElement('span');span.textContent=letter.toUpperCase();tile.appendChild(span);el.appendChild(tile);
    });
    geometry=null;
    drawMarks();
  }
  // Draw full-length rounded ribbons, including the gaps between letters.
  // Each discovered word is retained as its own colored path, so overlaps remain visible.
  function drawMarks(){
    const board=$('board'), svg=$('highlights');
    svg.replaceChildren();
    const rect=board.getBoundingClientRect();
    if(!rect.width)return;
    svg.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
    const cells=[...board.children];
    const centers=indices=>indices.map(i=>{
      const r=cells[i].getBoundingClientRect();
      return [r.left-rect.left+r.width/2,r.top-rect.top+r.height/2];
    });
    const ribbon=(indices,paint,opacity,active=false)=>{
      if(!indices.length)return;
      const pts=centers(indices), ns='http://www.w3.org/2000/svg';
      const line=document.createElementNS(ns,'polyline');
      line.setAttribute('points',pts.map(p=>p.join(',')).join(' '));
      line.setAttribute('fill','none');line.setAttribute('stroke',paint);
      line.setAttribute('stroke-opacity',String(opacity));
      line.setAttribute('stroke-width',String(cells[0].getBoundingClientRect().width*.83));
      line.setAttribute('stroke-linecap','round');line.setAttribute('stroke-linejoin','round');
      svg.appendChild(line);
    };
    // Semi-transparent layers make intersecting words visibly different.
    for(const [word,record] of found)ribbon(record.path,record.color,.64);
    activeLine=document.createElementNS('http://www.w3.org/2000/svg','polyline');
    activeLine.setAttribute('fill','none');activeLine.setAttribute('stroke','#7ba9ff');
    activeLine.setAttribute('stroke-opacity','.62');activeLine.setAttribute('stroke-linecap','round');
    activeLine.setAttribute('stroke-linejoin','round');
    activeLine.setAttribute('stroke-width',String(cells[0]?.getBoundingClientRect().width*.83||40));
    svg.appendChild(activeLine);
    drawActive();
    $('current').textContent=selection.map(i=>grid[i]).join('').toUpperCase();
  }
  function announce(message,type=''){
    $('message').textContent=message;$('message').className='message '+type;
  }
  // Cache tile geometry once per board/resize; never force 64 layouts per move.
  function measure(){
    const tiles=$('board').children;
    if(tiles.length!==64)return null;
    const first=tiles[0].getBoundingClientRect(), right=tiles[1].getBoundingClientRect();
    const down=tiles[8].getBoundingClientRect(), board=$('board').getBoundingClientRect();
    return geometry={left:first.left,top:first.top,stepX:right.left-first.left,
      stepY:down.top-first.top,width:first.width,height:first.height,
      boardLeft:board.left,boardTop:board.top};
  }
  function cellAt(x,y){
    const g=geometry||measure();if(!g)return -1;
    // Treat the entire 8x8 board as a continuous hit area, including tile gaps.
    // Round to the nearest tile center instead of requiring the pointer to
    // penetrate a tile's visible rectangle.
    const col=Math.round((x-(g.left+g.width/2))/g.stepX);
    const row=Math.round((y-(g.top+g.height/2))/g.stepY);
    const marginX=g.stepX*.42,marginY=g.stepY*.42;
    if(x<g.left-marginX||x>g.left+7*g.stepX+g.width+marginX||
       y<g.top-marginY||y>g.top+7*g.stepY+g.height+marginY)return -1;
    return at(Math.max(0,Math.min(7,row)),Math.max(0,Math.min(7,col)));
  }
  function straightPath(first,last){
    const r1=first>>3,c1=first&7,r2=last>>3,c2=last&7;
    const dr=r2-r1,dc=c2-c1;
    if(dr!==0&&dc!==0&&Math.abs(dr)!==Math.abs(dc))return null;
    const n=Math.max(Math.abs(dr),Math.abs(dc));
    return Array.from({length:n+1},(_,k)=>at(r1+k*Math.sign(dr),c1+k*Math.sign(dc)));
  }
  // Only the active overlay changes on pointer moves. Found ribbons are static.
  function drawActive(){
    if(!activeLine)return;
    const g=geometry||measure();if(!g)return;
    const points=selection.map(i=>{
      const x=g.left+(i&7)*g.stepX+g.width/2-g.boardLeft;
      const y=g.top+(i>>3)*g.stepY+g.height/2-g.boardTop;
      return `${x},${y}`;
    });
    activeLine.setAttribute('points',points.join(' '));
    $('current').textContent=selection.map(i=>grid[i]).join('').toUpperCase();
  }
  function updateAt(x,y){
    const cell=cellAt(x,y);if(cell<0)return;
    const path=straightPath(startIndex,cell);
    if(path && (path.length!==selection.length||path.some((v,i)=>v!==selection[i]))){
      selection=path;lastValidSelection=path.slice();drawActive();
    }
  }
  function onDown(e){
    if(!playing||dragging||e.pointerType==='mouse'&&e.button!==0)return;
    measure();const i=cellAt(e.clientX,e.clientY);if(i<0)return;
    e.preventDefault();dragging=true;pointerId=e.pointerId;startIndex=i;
    selection=[i];lastValidSelection=[i];lastPointer={x:e.clientX,y:e.clientY};
    $('board').setPointerCapture(e.pointerId);drawActive();
  }
  function trackTo(x,y){
    const prev=lastPointer||{x,y};const dx=x-prev.x,dy=y-prev.y;
    const g=geometry||measure();const step=Math.max(2,Math.min(g.stepX,g.stepY)/4);
    const n=Math.max(1,Math.min(256,Math.ceil(Math.hypot(dx,dy)/step)));
    for(let k=1;k<=n;k++)updateAt(prev.x+dx*k/n,prev.y+dy*k/n);
    lastPointer={x,y};
  }
  function onMove(e){
    if(!dragging||e.pointerId!==pointerId)return;
    e.preventDefault();
    const events=e.getCoalescedEvents?.()||[];
    for(const sample of events)trackTo(sample.clientX,sample.clientY);
    trackTo(e.clientX,e.clientY);
  }
  function onUp(e){
    if(!dragging||e.pointerId!==pointerId)return;
    if(e.cancelable)e.preventDefault();
    // A release always submits the last visible highlighted string, even if
    // pointer capture was lost, the cursor left the board, or no move fired.
    if(e.type==='pointerup')trackTo(e.clientX,e.clientY);
    selection=lastValidSelection.slice();
    submitSelection();
    dragging=false;pointerId=null;startIndex=-1;selection=[];
    lastPointer=null;lastValidSelection=[];drawActive();
  }
  function submitSelection(){
    if(!playing)return;
    const word=selection.map(i=>grid[i]).join('').toLowerCase();
    if(word.length<2)return;
    // Validate directly against the full dictionary, independently of the board scan.
    if(!lexicon.has(word)){announce(`Selected ${word.toUpperCase()} — not in the loaded dictionary. If you intended another word, check the highlighted letters.`,'bad');return;}
    if(found.has(word)){announce(`${word.toUpperCase()} already found.`,'bad');return;}
    const hue=color();found.set(word,{path:selection.slice(),color:hue});
    for(const i of selection)marks[i].push(hue);
    drawMarks();
    $('count').textContent=found.size;$('total').textContent=`${found.size} unique word${found.size===1?'':'s'}`;
    const chip=document.createElement('span');chip.className='chip';chip.textContent=word.toUpperCase();$('words').prepend(chip);
    announce(`+1  ${word.toUpperCase()} — nice find!`,'good');
    if(found.size>best){best=found.size;$('best').textContent=best;try{localStorage.setItem('wordlapse-best',String(best));}catch(_){}}
  }
  function tick(){
    if(!playing)return;
    const remaining=Math.max(0,deadline-performance.now());
    const sec=Math.ceil(remaining/1000);
    $('time').textContent=`0:${String(sec).padStart(2,'0')}`;
    $('time').classList.toggle('warning',sec<=10);
    $('progress').style.width=`${remaining/ROUND_MS*100}%`;
    $('progress').classList.toggle('low',sec<=10);
    if(remaining<=0)finish();
  }
  function finish(){
    playing=false;dragging=false;selection=[];drawMarks();clearInterval(ticker);
    $('time').textContent='0:00';$('progress').style.width='0%';
    $('overlayTitle').textContent="Time's up!";
    $('overlayText').textContent='Great round! Ready for another grid?';
    $('endScore').hidden=false;$('endScore').textContent=`${found.size} words`;
    $('endDetails').hidden=false;$('endDetails').textContent=`${validWords.size} distinct dictionary words were available on this board.`;
    $('play').textContent='Play again';$('overlay').hidden=false;
    announce(`Round complete: ${found.size} words found.`);
  }
  function newRound(){
    if(ticker)clearInterval(ticker);
    const result=makeBoard();grid=result.board;validWords=result.all;
    found=new Map();marks=Array.from({length:64},()=>[]);selection=[];dragging=false;lastPointer=null;lastValidSelection=[];
    $('count').textContent='0';$('total').textContent='0 unique words';$('words').replaceChildren();
    $('time').textContent='1:00';$('time').classList.remove('warning');$('progress').style.width='100%';$('progress').classList.remove('low');
    $('overlay').hidden=true;drawBoard();announce('Drag across a straight line and release to submit.');
    playing=true;deadline=performance.now()+ROUND_MS;ticker=setInterval(tick,80);
  }
  function initialize(){
    if(!seedWords.length||lexicon.size<1000){announce('Dictionary missing. Make sure dictionary.js is in the same folder.','bad');return;}
    $('play').disabled=false;$('play').textContent='Start 60-second round';$('restart').disabled=false;
    announce('Ready! Start a round to generate your board.');
    $('play').addEventListener('click',newRound);$('restart').addEventListener('click',newRound);
    $('board').addEventListener('pointerdown',onDown);
    window.addEventListener('resize',()=>{measure();drawMarks();});
    $('board').addEventListener('pointermove',onMove);
    // Window capture listeners receive the release even when it happens
    // outside the board or pointer capture is unexpectedly interrupted.
    window.addEventListener('pointerup',onUp,true);
    window.addEventListener('pointercancel',onUp,true);
    $('board').addEventListener('lostpointercapture',e=>{
      if(dragging&&e.pointerId===pointerId)onUp(e);
    });
    // Optional debugging in the browser console: wordLapseHasWord('toe')
    window.wordLapseHasWord = word => lexicon.has(String(word).trim().toLowerCase());
    window.wordLapseSelection = () => selection.map(i=>grid[i]).join('').toLowerCase();
    // An initial placeholder board stays behind the welcome overlay.
    grid=Array.from({length:64},randomLetter);drawBoard();
  }
  initialize();
})();
