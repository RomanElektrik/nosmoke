// Animated "iridescent" background — a WebView running an HTML+Canvas particle
// field. ~20 big soft radial blobs drift, bounce and pulse with `screen` blend,
// then the whole canvas is blurred (CSS blur 60px) into a smooth living aurora.
//
// Heavier than a native gradient (it's a WebView), so use it on a single screen
// (e.g. the audio player), NOT inside scrolling lists.

import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

function html(auraColor: string, bgColor1: string, bgColor2: string): string {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
  html,body{margin:0;height:100%;background:#06080c;overflow:hidden}
  #atmo{position:absolute;inset:0;background:radial-gradient(circle at 50% -20%, ${bgColor1}, ${bgColor2});transition:background 1.2s ease}
  #c{position:absolute;inset:0;width:100%;height:100%;filter:blur(60px) saturate(1.5);opacity:0.55}
</style></head><body>
<div id="atmo"></div>
<canvas id="c"></canvas>
<script>
  var cv=document.getElementById('c'),x=cv.getContext('2d');
  var W,H,DPR=Math.min(window.devicePixelRatio||1,2);
  function size(){W=cv.width=innerWidth*DPR;H=cv.height=innerHeight*DPR;}
  size();window.addEventListener('resize',size);
  var COLORS=['${auraColor}','${bgColor1}','${bgColor2}'];
  function hex(c){c=c.replace('#','');if(c.length===3)c=c[0]+c[0]+c[1]+c[1]+c[2]+c[2];return [parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)];}
  var N=20,P=[];
  for(var i=0;i<N;i++){
    var col=hex(COLORS[(Math.random()*COLORS.length)|0]);
    P.push({
      x:Math.random()*W,y:Math.random()*H,
      r:(120+Math.random()*180)*DPR,
      vx:(Math.random()-0.5)*0.35*DPR,vy:(Math.random()-0.5)*0.35*DPR,
      a:0.2+Math.random()*0.5,da:(Math.random()<0.5?-1:1)*(0.0015+Math.random()*0.0025),
      col:col
    });
  }
  function frame(){
    x.clearRect(0,0,W,H);
    x.globalCompositeOperation='screen';
    for(var i=0;i<N;i++){
      var p=P[i];
      p.x+=p.vx;p.y+=p.vy;
      if(p.x<-p.r)p.x=W+p.r;if(p.x>W+p.r)p.x=-p.r;
      if(p.y<-p.r)p.y=H+p.r;if(p.y>H+p.r)p.y=-p.r;
      p.a+=p.da;if(p.a<0.18){p.a=0.18;p.da*=-1;}if(p.a>0.7){p.a=0.7;p.da*=-1;}
      var g=x.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
      g.addColorStop(0,'rgba('+p.col[0]+','+p.col[1]+','+p.col[2]+','+p.a+')');
      g.addColorStop(1,'rgba('+p.col[0]+','+p.col[1]+','+p.col[2]+',0)');
      x.fillStyle=g;x.beginPath();x.arc(p.x,p.y,p.r,0,6.2832);x.fill();
    }
    requestAnimationFrame(frame);
  }
  frame();
</script></body></html>`;
}

export const AnimatedAuraBackground = memo(function AnimatedAuraBackground({
  auraColor, bgColor1, bgColor2,
}: { auraColor: string; bgColor1: string; bgColor2: string }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <WebView
        pointerEvents="none"
        style={{ flex: 1, backgroundColor: '#06080c' }}
        originWhitelist={['*']}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        androidLayerType="hardware"
        source={{ html: html(auraColor, bgColor1, bgColor2) }}
      />
    </View>
  );
});
