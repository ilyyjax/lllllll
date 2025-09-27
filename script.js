const dropArea = document.getElementById("drop-area");
const fileElem = document.getElementById("fileElem");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");
const scaleRange = document.getElementById("scaleRange");
const rotateRange = document.getElementById("rotateRange");

let bgImg = null;
let hatImg = new Image();
hatImg.src = "hat.png";

let hat = { x: 150, y: 40, scale: 1, rotation: 0 };
let dragging = false;
let dragOffset = {x:0,y:0};

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models")
]);

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(bgImg){
    const W = canvas.width;
    const H = canvas.height;
    const r = Math.min(W/bgImg.width, H/bgImg.height);
    const dw = bgImg.width*r, dh = bgImg.height*r;
    const dx = (W-dw)/2, dy = (H-dh)/2;
    ctx.drawImage(bgImg,dx,dy,dw,dh);
    const hatW = hatImg.width*hat.scale;
    const hatH = hatImg.height*hat.scale;
    ctx.save();
    ctx.translate(hat.x+hatW/2,hat.y+hatH/2);
    ctx.rotate(hat.rotation*Math.PI/180);
    ctx.drawImage(hatImg,-hatW/2,-hatH/2,hatW,hatH);
    ctx.restore();
  }
}

function handleFiles(file){
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = async ()=>{
    bgImg = img;
    canvas.width = img.width;
    canvas.height = img.height;
    hat.scale = 1;
    hat.rotation = 0;
    try{
      const detection = await faceapi.detectSingleFace(img,new faceapi.TinyFaceDetectorOptions());
      if(detection){
        const box = detection.box;
        hat.x = box.x + box.width/2 - 60;
        hat.y = box.y - 40;
        hat.scale = box.width/120;
      }else{
        hat.x = img.width/2 - 100;
        hat.y = 20;
      }
    }catch(err){
      hat.x = img.width/2 - 100;
      hat.y = 20;
    }
    draw();
  };
  img.src = url;
}

dropArea.addEventListener("click",()=>fileElem.click());
dropArea.addEventListener("dragover",e=>{e.preventDefault();});
dropArea.addEventListener("drop",e=>{e.preventDefault(); if(e.dataTransfer.files.length) handleFiles(e.dataTransfer.files[0]);});
fileElem.addEventListener("change",()=>{if(fileElem.files.length) handleFiles(fileElem.files[0]);});

scaleRange.addEventListener("input",()=>{hat.scale=parseFloat(scaleRange.value); draw();});
rotateRange.addEventListener("input",()=>{hat.rotation=parseFloat(rotateRange.value); draw();});

canvas.addEventListener("mousedown",e=>{
  const hatW = hatImg.width*hat.scale;
  const hatH = hatImg.height*hat.scale;
  if(e.offsetX>hat.x && e.offsetX<hat.x+hatW && e.offsetY>hat.y && e.offsetY<hat.y+hatH){
    dragging=true;
    dragOffset.x=e.offsetX-hat.x;
    dragOffset.y=e.offsetY-hat.y;
  }
});
canvas.addEventListener("mousemove",e=>{
  if(dragging){
    hat.x=e.offsetX-dragOffset.x;
    hat.y=e.offsetY-dragOffset.y;
    draw();
  }
});
canvas.addEventListener("mouseup",()=>dragging=false);
canvas.addEventListener("mouseleave",()=>dragging=false);

saveBtn.addEventListener("click",()=>{
  const link=document.createElement("a");
  link.download="locktober.png";
  link.href=canvas.toDataURL();
  link.click();
});

resetBtn.addEventListener("click",()=>{
  hat={x:150,y:40,scale:1,rotation:0};
  draw();
});
