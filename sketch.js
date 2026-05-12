let video;
let faceMesh;
let faces = [];
let handPose;
let hands = [];
let earringImgs = [];
let currentEarring = 1; // 預設顯示第一款

function preload() {
  // 改用 faceMesh，對於只有頭部入鏡的攝影機畫面辨識率極高
  faceMesh = ml5.faceMesh();
  // 載入手勢辨識模型
  handPose = ml5.handPose();
  
  // 載入 1~5 款指定目錄的耳環圖片
  earringImgs[1] = loadImage('pic/acc/acc1_ring.png');
  earringImgs[2] = loadImage('pic/acc/acc2_pearl.png');
  earringImgs[3] = loadImage('pic/acc/acc3_tassel.png');
  earringImgs[4] = loadImage('pic/acc/acc4_jade.png');
  earringImgs[5] = loadImage('pic/acc/acc5_phoenix.png');
}

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 擷取攝影機影像
  video = createCapture(VIDEO);
  video.size(640, 480); // 設定固定解析度以利辨識座標對應
  // 隱藏原始的 HTML 影片元件
  video.hide();

  // 開始持續偵測臉部與手部
  faceMesh.detectStart(video, gotFaces);
  handPose.detectStart(video, gotHands);
}

function gotFaces(results) {
  // 將辨識結果存入 faces 變數
  faces = results;
}

function gotHands(results) {
  // 將辨識結果存入 hands 變數
  hands = results;
}

function draw() {
  // 設定背景顏色為 e7c6ff
  background('#e7c6ff');

  let w = width * 0.5; // 畫布寬度的 50%
  let h = height * 0.5; // 畫布高度的 50%
  let x = (width - w) / 2; // 置中水平座標
  let y = (height - h) / 2; // 置中垂直座標

  // 新增：繪製畫布上方文字
  push();
  fill(0); // 設定文字顏色為黑色
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(32);
  text("412730946謝同學", width / 2, y / 2 - 20);
  textSize(24);
  text("作品為影像辨識_耳環臉譜", width / 2, y / 2 + 20);
  // 新增：手勢提示文字
  textSize(16);
  text("提示：對鏡頭比出 1~5 的手勢可切換不同耳環款式", width / 2, y / 2 + 50);
  pop();

  push();
  // 將座標系移動到影像預定位置的右緣，準備進行翻轉
  translate(x + w, y);
  // 水平翻轉 (x 軸 -1)
  scale(-1, 1);
  // 繪製影像
  image(video, 0, 0, w, h);

  // 手勢辨識判斷：計算伸出的手指數量來切換耳環
  if (hands.length > 0) {
    let hand = hands[0];
    let fingers = 0;
    let tips = [8, 12, 16, 20]; // 食指、中指、無名指、小指的指尖索引
    let pips = [6, 10, 14, 18]; // 對應的第二關節索引
    
    // 判斷食指到小指是否伸直 (指尖 y 座標小於關節 y 座標表示伸直)
    for (let i = 0; i < 4; i++) {
      if (hand.keypoints[tips[i]].y < hand.keypoints[pips[i]].y) {
        fingers++;
      }
    }
    
    // 判斷大拇指是否伸出 (利用大拇指指尖與小指根部的距離，比較大拇指根部與小指根部的距離)
    let tipDist = dist(hand.keypoints[4].x, hand.keypoints[4].y, hand.keypoints[17].x, hand.keypoints[17].y);
    let baseDist = dist(hand.keypoints[2].x, hand.keypoints[2].y, hand.keypoints[17].x, hand.keypoints[17].y);
    if (tipDist > baseDist) {
      fingers++;
    }
    
    // 若偵測到的手指數量在 1~5 之間，更新目前耳環款式
    if (fingers >= 1 && fingers <= 5) {
      currentEarring = fingers;
    }
  }

  // 若辨識到臉部特徵點，則在左右耳處顯示對應的耳環圖片
  if (faces.length > 0) {
    let face = faces[0];
    
    // FaceMesh 中，132 為左耳垂附近，361 為右耳垂附近
    let leftEar = face.keypoints[132];
    let rightEar = face.keypoints[361];

    // 傳入 isLeftEar 參數 (true/false) 以判斷左右耳，用來決定往外移動的方向
    if (leftEar) drawEarring(leftEar.x, leftEar.y, w, h, true);
    if (rightEar) drawEarring(rightEar.x, rightEar.y, w, h, false);
  } else {
    // 若沒有偵測到臉部，顯示提示文字 (需先還原翻轉狀態以免字體左右相反)
    pop();
    fill(255, 100, 100);
    noStroke();
    textSize(24);
    textAlign(CENTER);
    text("正在尋找臉部... (請確保臉部在鏡頭前)", width / 2, y - 20);
    push(); // 補回 push 以免最後的 pop 報錯
  }
  pop();
}

function drawEarring(earX, earY, imgW, imgH, isLeftEar) {
  // 將偵測到的原始影片座標(固定為 640x480)對應到畫面上顯示的影像大小
  // 改用固定的 640 與 480，避免影片尚未載入時造成座標計算錯誤
  let px = map(earX, 0, 640, 0, imgW);
  let py = map(earY, 0, 480, 0, imgH);

  // 使用比率的方式往外移動 (以影像寬度的百分比來計算)
  let offsetX = imgW * 0.03; // 影像寬度的 3% 作為往外移動的比率

  if (isLeftEar) {
    px += offsetX; // 由於畫布經過水平翻轉(scale(-1, 1))，左耳對應的 x 加上偏移會更靠畫面左側(往外)
  } else {
    px -= offsetX; // 右耳減去偏移會更靠畫面右側(往外)
  }

  push();
  imageMode(CENTER);
  // 繪製耳環圖片。若圖片比例不同，可以自行調整寬高數值 (此處設為 40x60)
  let img = earringImgs[currentEarring];
  // 將 Y 座標加上 30 (圖片高度 60 的一半)，確保耳環的最頂端剛好貼齊耳垂
  if (img) image(img, px, py + 30, 40, 60);
  pop();
}

function windowResized() {
  // 當視窗大小改變時，重新調整畫布大小
  resizeCanvas(windowWidth, windowHeight);
}