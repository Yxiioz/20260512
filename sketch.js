let video;
let bodyPose;
let poses = [];

function preload() {
  // 載入 ml5.js 的 bodyPose 模型進行影像辨識
  bodyPose = ml5.bodyPose();
}

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 擷取攝影機影像
  video = createCapture(VIDEO);
  video.size(640, 480); // 設定固定解析度以利辨識座標對應
  // 隱藏原始的 HTML 影片元件
  video.hide();

  // 開始持續偵測身體姿勢 (包含耳朵特徵點)
  bodyPose.detectStart(video, gotPoses);
}

function gotPoses(results) {
  // 將辨識結果存入 poses 變數
  poses = results;
}

function draw() {
  // 設定背景顏色為 e7c6ff
  background('#e7c6ff');

  let w = width * 0.5; // 畫布寬度的 50%
  let h = height * 0.5; // 畫布高度的 50%
  let x = (width - w) / 2; // 置中水平座標
  let y = (height - h) / 2; // 置中垂直座標

  push();
  // 將座標系移動到影像預定位置的右緣，準備進行翻轉
  translate(x + w, y);
  // 水平翻轉 (x 軸 -1)
  scale(-1, 1);
  // 繪製影像
  image(video, 0, 0, w, h);

  // 若辨識到身體特徵點，則在左右耳處畫出三個黃色圓圈 (耳環效果)
  if (poses.length > 0) {
    let pose = poses[0];
    // 取出左右耳的特徵資料
    let leftEar = pose.left_ear;
    let rightEar = pose.right_ear;

    // 信心指數大於 0.1 才繪製，避免畫面雜訊造成誤判
    if (leftEar.confidence > 0.1) {
      drawEarring(leftEar.x, leftEar.y, w, h);
    }
    if (rightEar.confidence > 0.1) {
      drawEarring(rightEar.x, rightEar.y, w, h);
    }
  }
  pop();
}

function drawEarring(earX, earY, imgW, imgH) {
  // 將偵測到的原始影片座標對應到畫面上顯示的影像大小
  let px = map(earX, 0, video.width, 0, imgW);
  let py = map(earY, 0, video.height, 0, imgH);

  fill(255, 255, 0); // 設定圓圈顏色為黃色
  noStroke();
  // 稍微向下偏移模擬耳垂位置，垂直向下連續畫出三個圓圈
  let startY = py + 15;
  for (let i = 0; i < 3; i++) {
    circle(px, startY + (i * 15), 10);
  }
}

function windowResized() {
  // 當視窗大小改變時，重新調整畫布大小
  resizeCanvas(windowWidth, windowHeight);
}