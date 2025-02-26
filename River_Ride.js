const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const fuelLevelElement = document.getElementById('fuelLevel');

// Canvas boyutlarını ayarla
canvas.width = 400;
canvas.height = 600;

// Oyun sabitleri
const FUEL_DECREASE_RATE = 0.1;
const FUEL_STATION_WIDTH = 50;
const FUEL_STATION_HEIGHT = 80;
const FUEL_REFILL_RATE = 0.5;
const BACKGROUND_SPEED = 2;
const WAVE_SPEED = 0.02;
const MISSILE_SPEED = 4;
const MISSILE_SPAWN_RATE = 1500; // 2000'den 1500'e düşürüldü (daha sık füze)
const EXPLOSION_DURATION = 1000; // Patlama animasyonu süresi (ms)

// Uçak özellikleri
const plane = {
    x: canvas.width / 2,
    y: 100,
    width: 34,  // %15 küçültüldü (40 * 0.85)
    height: 68, // %15 küçültüldü (80 * 0.85)
    speed: 5,
    fuel: 100,
    isRefueling: false
};

// Yakıt istasyonları (sayısı azaltıldı)
const fuelStations = [
    { x: 200, y: 200 } // Tek istasyon bırakıldı
];

// Tuş kontrolleri
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

// Tuş dinleyicileri
document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = false;
    }
});

// Piksel efekti için yardımcı fonksiyon
function drawPixelRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(width), Math.floor(height));
    
    // Piksel efekti için kenar çizgileri
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(width), 1);
    ctx.fillRect(Math.floor(x), Math.floor(y), 1, Math.floor(height));
    
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(Math.floor(x + width - 1), Math.floor(y), 1, Math.floor(height));
    ctx.fillRect(Math.floor(x), Math.floor(y + height - 1), Math.floor(width), 1);
}

// Alev animasyonu için değişkenler
let flameSize = 0;
let flameOffset = 0;

// Rastgele alev boyutu üret
function getRandomFlameSize(min, max) {
    return Math.random() * (max - min) + min;
}

// Uçağı çiz
function drawPlane() {
    ctx.save();
    const centerX = plane.x + plane.width / 2;
    const centerY = plane.y + plane.height / 2;
    
    ctx.translate(centerX, centerY);
    ctx.rotate(Math.PI / 2);
    ctx.translate(-centerY, -centerX);

    // Alev animasyonu
    flameSize = getRandomFlameSize(4, 13);
    flameOffset = getRandomFlameSize(-1.7, 1.7);
    
    // Alevler (çift motor)
    const motorPositions = [
        {x: plane.x + 7, y: plane.y + plane.height - 4},
        {x: plane.x + plane.width - 12, y: plane.y + plane.height - 4}
    ];
    
    motorPositions.forEach(pos => {
        const gradient = ctx.createLinearGradient(
            pos.y,
            pos.x,
            pos.y + flameSize,
            pos.x
        );
        gradient.addColorStop(0, '#FF4500');
        gradient.addColorStop(0.5, '#FFA500');
        gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
        
        ctx.beginPath();
        ctx.moveTo(pos.y, pos.x - 2);
        ctx.lineTo(pos.y + flameSize, pos.x + flameOffset);
        ctx.lineTo(pos.y, pos.x + 4);
        ctx.fillStyle = gradient;
        ctx.fill();
    });

    // Gövde gölgesi
    drawPixelRect(plane.y + 4, plane.x + plane.width - 7, plane.height - 8, 7, '#1a3315');

    // Ana gövde (koyu yeşil)
    drawPixelRect(plane.y, plane.x, plane.height, plane.width, '#2D4F1E');
    
    // Sivri burun
    ctx.beginPath();
    ctx.fillStyle = '#8B7355';
    ctx.moveTo(plane.y, plane.x + plane.width/2);
    ctx.lineTo(plane.y + 21, plane.x + plane.width/2 - 7);
    ctx.lineTo(plane.y + 21, plane.x + plane.width/2 + 7);
    ctx.closePath();
    ctx.fill();
    
    // Burnun ucundaki üçgen
    ctx.beginPath();
    ctx.fillStyle = '#666666';
    ctx.moveTo(plane.y + 21, plane.x + plane.width/2 - 3);
    ctx.lineTo(plane.y + 25, plane.x + plane.width/2);
    ctx.lineTo(plane.y + 21, plane.x + plane.width/2 + 3);
    ctx.closePath();
    ctx.fill();
    
    // Burun gölgesi
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.moveTo(plane.y + 15, plane.x + plane.width/2);
    ctx.lineTo(plane.y + 30, plane.x + plane.width/2 - 4);
    ctx.lineTo(plane.y + 30, plane.x + plane.width/2 + 4);
    ctx.closePath();
    ctx.fill();
    
    // Gövde detayları ve paneller
    const panelColor = '#1a3315';
    drawPixelRect(plane.y + 21, plane.x + 10, plane.height - 34, 2, panelColor);
    drawPixelRect(plane.y + 21, plane.x + 15, plane.height - 34, 2, panelColor);
    drawPixelRect(plane.y + 21, plane.x + 20, plane.height - 34, 2, panelColor);
    
    // Yatay panel çizgileri
    for(let i = 25; i < plane.height - 17; i += 13) {
        drawPixelRect(plane.y + i, plane.x + 4, 2, plane.width - 8, panelColor);
    }
    
    // Kanatlar (daha büyük ve açılı)
    // Üst kanatlar
    ctx.save();
    ctx.translate(plane.y + 30, plane.x - 17);
    ctx.rotate(-0.2);
    drawPixelRect(0, 0, 43, 8, '#2D4F1E');
    // Kanat detayları
    drawPixelRect(4, 2, 34, 2, panelColor);
    drawPixelRect(8, 4, 30, 2, panelColor);
    ctx.restore();
    
    // Alt kanatlar
    ctx.save();
    ctx.translate(plane.y + 30, plane.x + plane.width + 8);
    ctx.rotate(0.2);
    drawPixelRect(0, 0, 43, 8, '#2D4F1E');
    // Kanat detayları
    drawPixelRect(4, 2, 34, 2, panelColor);
    drawPixelRect(8, 4, 30, 2, panelColor);
    ctx.restore();
    
    // Kanat uçları (füze rayları)
    drawPixelRect(plane.y + 51, plane.x - 17, 7, 10, '#4a4a4a');
    drawPixelRect(plane.y + 51, plane.x + plane.width + 7, 7, 10, '#4a4a4a');
    
    // Kuyruk tasarımı
    // Ana kuyruk
    drawPixelRect(plane.y + plane.height - 21, plane.x - 13, 21, 60, '#2D4F1E');
    // Kuyruk detayları
    drawPixelRect(plane.y + plane.height - 17, plane.x + 4, 17, 3, panelColor);
    drawPixelRect(plane.y + plane.height - 13, plane.x + 13, 13, 3, panelColor);
    
    // Kokpit (daha detaylı)
    // Kokpit çerçevesi
    drawPixelRect(plane.y + 13, plane.x + 7, 21, 20, '#1a3315');
    
    // Cam (gradyan efekti)
    const cockpitGradient = ctx.createLinearGradient(
        plane.y + 13, plane.x + 7,
        plane.y + 34, plane.x + 27
    );
    cockpitGradient.addColorStop(0, '#3399FF');
    cockpitGradient.addColorStop(0.5, '#99CCFF');
    cockpitGradient.addColorStop(1, '#3399FF');
    
    ctx.fillStyle = cockpitGradient;
    ctx.fillRect(plane.y + 14, plane.x + 8, 18, 17);
    
    // Kokpit yansımaları
    drawPixelRect(plane.y + 16, plane.x + 10, 3, 10, '#FFFFFF');
    drawPixelRect(plane.y + 21, plane.x + 12, 3, 8, '#FFFFFF');
    
    // Motor detayları
    motorPositions.forEach(pos => {
        drawPixelRect(pos.y - 2, pos.x - 3, 6, 7, '#444444');
        drawPixelRect(pos.y - 1, pos.x - 2, 4, 5, '#333333');
        // Motor içi
        drawPixelRect(pos.y, pos.x - 1, 2, 3, '#222222');
    });
    
    // Antenler ve sensörler
    drawPixelRect(plane.y + plane.height - 26, plane.x - 4, 2, 7, '#4a4a4a');
    drawPixelRect(plane.y + plane.height - 34, plane.x + plane.width - 3, 2, 7, '#4a4a4a');
    
    ctx.restore();
}

// Yakıt istasyonlarını çiz
function drawFuelStations() {
    fuelStations.forEach(station => {
        // Ana istasyon gövdesi
        drawPixelRect(station.x, station.y, FUEL_STATION_WIDTH, FUEL_STATION_HEIGHT, '#444444');
        
        // İç kısım (daha açık renk)
        drawPixelRect(station.x + 4, station.y + 4, FUEL_STATION_WIDTH - 8, FUEL_STATION_HEIGHT - 8, '#666666');
        
        // Üst kısım (çatı)
        drawPixelRect(station.x - 6, station.y, FUEL_STATION_WIDTH + 12, 10, '#333333');
        drawPixelRect(station.x - 3, station.y + 10, FUEL_STATION_WIDTH + 6, 3, '#222222');
        
        // Yakıt pompası detayları
        const pumpWidth = 15;
        const pumpX = station.x + FUEL_STATION_WIDTH;
        
        // Pompa gövdesi
        drawPixelRect(pumpX, station.y + 25, pumpWidth, 40, '#ffaa00');
        drawPixelRect(pumpX + 2, station.y + 27, pumpWidth - 4, 36, '#ff8800');
        
        // Pompa ekranı
        drawPixelRect(pumpX + 3, station.y + 30, pumpWidth - 6, 15, '#000000');
        drawPixelRect(pumpX + 4, station.y + 31, pumpWidth - 8, 13, '#00ff00');
        
        // Pompa hortumu
        drawPixelRect(pumpX + 4, station.y + 48, pumpWidth - 8, 15, '#333333');
        
        // "FUEL" yazısı
        ctx.save();
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 16px Arial'; // Font boyutu küçültüldü
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Dikey "FUEL" yazısı
        ctx.translate(station.x + FUEL_STATION_WIDTH/2, station.y + FUEL_STATION_HEIGHT/2);
        ctx.rotate(-Math.PI/2);
        ctx.fillText('FUEL', 0, 0);
        
        // Fiyat göstergesi
        ctx.rotate(Math.PI/2);
        ctx.font = 'bold 12px Arial'; // Font boyutu küçültüldü
        ctx.fillStyle = '#00ff00';
        ctx.fillText('$2.99/L', 0, 30);
        ctx.restore();
        
        // Işıklandırma efekti
        const gradient = ctx.createLinearGradient(
            station.x, station.y,
            station.x + FUEL_STATION_WIDTH, station.y + FUEL_STATION_HEIGHT
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(station.x, station.y, FUEL_STATION_WIDTH, FUEL_STATION_HEIGHT);
        
        // Zemin gölgesi
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(station.x - 10, station.y + FUEL_STATION_HEIGHT, FUEL_STATION_WIDTH + 20, 4);
    });
}

// Çarpışma kontrolü
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Yakıt istasyonlarıyla çarpışma kontrolü
function checkFuelStationCollision() {
    return fuelStations.some(station => 
        checkCollision(plane, {
            x: station.x,
            y: station.y,
            width: FUEL_STATION_WIDTH,
            height: FUEL_STATION_HEIGHT
        })
    );
}

// Dalga animasyonu için değişkenler
let waveOffset = 0;

// Arka plan için dalga deseni
function drawOcean() {
    // Açık lacivert arka plan
    ctx.fillStyle = '#1e4d8f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dalgalar
    const waveHeight = 20;
    const waveWidth = 30;
    
    ctx.fillStyle = '#2666ba';
    for (let y = -waveHeight; y < canvas.height + waveHeight; y += waveHeight) {
        let adjustedY = (y + waveOffset) % (canvas.height + waveHeight);
        for (let x = -waveWidth; x < canvas.width + waveWidth; x += waveWidth) {
            ctx.beginPath();
            ctx.moveTo(x, adjustedY);
            for (let i = 0; i <= waveWidth; i++) {
                const dx = x + i;
                const dy = adjustedY + Math.sin((dx + waveOffset) / waveWidth * Math.PI) * 5;
                ctx.lineTo(dx, dy);
            }
            ctx.lineTo(x + waveWidth, adjustedY + waveHeight);
            ctx.lineTo(x, adjustedY + waveHeight);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    // Dalga animasyonunu güncelle
    waveOffset += BACKGROUND_SPEED;
}

// Yakıt istasyonlarını güncelle
function updateFuelStations() {
    fuelStations.forEach(station => {
        station.y += BACKGROUND_SPEED; // Aşağı doğru kaydır
        
        // Eğer istasyon ekranın altından çıktıysa, üstten yeni pozisyonla geri getir
        if (station.y > canvas.height) {
            station.y = -FUEL_STATION_HEIGHT;
            station.x = Math.random() * (canvas.width - FUEL_STATION_WIDTH);
        }
    });
}

// Oyun durumu
const gameState = {
    isPlaying: false,
    showMenu: true,
    gameOver: false,
    score: 0,
    explosionTime: 0,
    missileInterval: null // Füze interval'ini takip etmek için
};

// Füzeler dizisi
const missiles = [];

// Patlama parçacıkları
const explosionParticles = [];

// Füze oluştur
function createMissile() {
    if (gameState.isPlaying && Math.random() > 0.05) { // %95 ihtimalle füze oluştur (0.15'ten 0.05'e düşürüldü)
        // Aynı anda 2-3 füze oluştur
        const missileCount = Math.floor(Math.random() * 2) + 2; // 2 veya 3 füze
        
        for(let i = 0; i < missileCount; i++) {
            missiles.push({
                x: Math.random() * (canvas.width - 20),
                y: -30 - (i * 20), // Füzeler arası mesafe
                width: 20,
                height: 40,
                speed: MISSILE_SPEED + (Math.random() * 2.5) // Füze hızı biraz daha artırıldı
            });
        }
    }
}

// Füzeleri çiz
function drawMissiles() {
    missiles.forEach(missile => {
        ctx.save();
        // Füzenin merkezi etrafında döndürme
        ctx.translate(missile.x + missile.width/2, missile.y + missile.height/2);
        ctx.rotate(Math.PI); // 180 derece döndür
        ctx.translate(-(missile.x + missile.width/2), -(missile.y + missile.height/2));

        // Füze gövdesi (beyaz metalik görünüm)
        const bodyGradient = ctx.createLinearGradient(
            missile.x, missile.y,
            missile.x + missile.width, missile.y
        );
        bodyGradient.addColorStop(0, '#E0E0E0');  // Hafif gri
        bodyGradient.addColorStop(0.5, '#FFFFFF'); // Parlak beyaz
        bodyGradient.addColorStop(1, '#E0E0E0');  // Hafif gri
        
        drawPixelRect(missile.x, missile.y, missile.width, missile.height, bodyGradient);
        
        // Kırmızı şeritler (gövde üzerinde)
        drawPixelRect(missile.x, missile.y + missile.height * 0.2, missile.width, 4, '#FF0000');
        drawPixelRect(missile.x, missile.y + missile.height * 0.6, missile.width, 4, '#FF0000');
        
        // Füze başlığı (kırmızı)
        ctx.beginPath();
        const headGradient = ctx.createLinearGradient(
            missile.x, missile.y - 15,
            missile.x + missile.width, missile.y - 15
        );
        headGradient.addColorStop(0, '#CC0000');
        headGradient.addColorStop(0.5, '#FF0000');
        headGradient.addColorStop(1, '#CC0000');
        
        ctx.fillStyle = headGradient;
        ctx.moveTo(missile.x + missile.width/2, missile.y - 15);
        ctx.lineTo(missile.x + missile.width, missile.y);
        ctx.lineTo(missile.x, missile.y);
        ctx.closePath();
        ctx.fill();
        
        // Füze kanatçıkları (kırmızı)
        const finColor = '#FF0000';
        // Sol kanatçık
        ctx.beginPath();
        ctx.fillStyle = finColor;
        ctx.moveTo(missile.x, missile.y + missile.height * 0.7);
        ctx.lineTo(missile.x - 8, missile.y + missile.height * 0.9);
        ctx.lineTo(missile.x, missile.y + missile.height * 0.8);
        ctx.closePath();
        ctx.fill();
        
        // Sağ kanatçık
        ctx.beginPath();
        ctx.moveTo(missile.x + missile.width, missile.y + missile.height * 0.7);
        ctx.lineTo(missile.x + missile.width + 8, missile.y + missile.height * 0.9);
        ctx.lineTo(missile.x + missile.width, missile.y + missile.height * 0.8);
        ctx.closePath();
        ctx.fill();
        
        // Füze detayları (kırmızı)
        drawPixelRect(missile.x + missile.width * 0.3, missile.y + 5, 2, missile.height - 10, '#FF0000');
        drawPixelRect(missile.x + missile.width * 0.7, missile.y + 5, 2, missile.height - 10, '#FF0000');
        
        // Motor bölümü (metalik gri)
        const engineWidth = missile.width * 0.6;
        const engineX = missile.x + (missile.width - engineWidth) / 2;
        drawPixelRect(engineX, missile.y + missile.height - 10, engineWidth, 10, '#444444');
        
        // Alev efekti (daha gerçekçi)
        const flameHeight = Math.random() * 15 + 20;
        const flameGradient = ctx.createLinearGradient(
            missile.x + missile.width/2, missile.y + missile.height,
            missile.x + missile.width/2, missile.y + missile.height + flameHeight
        );
        flameGradient.addColorStop(0, '#FF4500');
        flameGradient.addColorStop(0.3, '#FFA500');
        flameGradient.addColorStop(0.6, '#FFD700');
        flameGradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
        
        ctx.beginPath();
        ctx.fillStyle = flameGradient;
        ctx.moveTo(engineX, missile.y + missile.height);
        ctx.quadraticCurveTo(
            missile.x + missile.width/2, missile.y + missile.height + flameHeight * 1.2,
            engineX + engineWidth, missile.y + missile.height
        );
        ctx.fill();
        
        // İç alev
        const innerFlameGradient = ctx.createLinearGradient(
            missile.x + missile.width/2, missile.y + missile.height,
            missile.x + missile.width/2, missile.y + missile.height + flameHeight * 0.7
        );
        innerFlameGradient.addColorStop(0, '#FFFFFF');
        innerFlameGradient.addColorStop(0.5, '#FFA500');
        innerFlameGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.beginPath();
        ctx.fillStyle = innerFlameGradient;
        ctx.moveTo(engineX + engineWidth * 0.3, missile.y + missile.height);
        ctx.quadraticCurveTo(
            missile.x + missile.width/2, missile.y + missile.height + flameHeight * 0.8,
            engineX + engineWidth * 0.7, missile.y + missile.height
        );
        ctx.fill();
        
        ctx.restore();
    });
}

// Patlama efekti oluştur
function createExplosion(x, y) {
    for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 / 30) * i;
        const speed = Math.random() * 5 + 2;
        explosionParticles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            color: ['#ff0000', '#ff4400', '#ff8800'][Math.floor(Math.random() * 3)]
        });
    }
    gameState.explosionTime = Date.now();
}

// Patlama efektini çiz
function drawExplosion() {
    explosionParticles.forEach((particle, index) => {
        ctx.beginPath();
        ctx.fillStyle = particle.color + Math.floor(particle.life * 255).toString(16).padStart(2, '0');
        ctx.arc(particle.x, particle.y, particle.life * 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Parçacıkları hareket ettir
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.02;
        
        // Ömrü biten parçacıkları sil
        if (particle.life <= 0) {
            explosionParticles.splice(index, 1);
        }
    });
}

// Menüyü çiz
function drawMenu() {
    // Yarı saydam siyah arka plan
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Başlık
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('F-4 PHANTOM', canvas.width/2, canvas.height/3);
    
    // Başla butonu
    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonX = canvas.width/2 - buttonWidth/2;
    const buttonY = canvas.height/2 - buttonHeight/2;
    
    // Buton arka planı
    ctx.fillStyle = '#2D4F1E';
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    // Buton kenarlığı
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    // Buton yazısı
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('BAŞLA', canvas.width/2, canvas.height/2);
    
    // Kontrol talimatları
    ctx.font = '16px Arial';
    ctx.fillText('Kontroller:', canvas.width/2, canvas.height/2 + 80);
    ctx.fillText('↑ ↓ ← → Tuşları ile hareket et', canvas.width/2, canvas.height/2 + 110);
    ctx.fillText('Yakıt istasyonlarına uğramayı unutma!', canvas.width/2, canvas.height/2 + 140);
}

// Game Over menüsünü çiz
function drawGameOver() {
    // Yarı saydam siyah arka plan
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Game Over yazısı
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/3);
    
    // Skor
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`Skor: ${gameState.score}`, canvas.width/2, canvas.height/2);
    
    // Yeniden başlat butonu
    const buttonWidth = 250;
    const buttonHeight = 60;
    const buttonX = canvas.width/2 - buttonWidth/2;
    const buttonY = canvas.height/2 + 50;
    
    // Buton arka planı
    ctx.fillStyle = '#2D4F1E';
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    // Buton kenarlığı
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    // Buton yazısı
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('YENİDEN BAŞLAT', canvas.width/2, buttonY + buttonHeight/2);
}

// Tıklama olayını güncelle
canvas.addEventListener('click', (e) => {
    if (!gameState.isPlaying) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const buttonWidth = gameState.gameOver ? 250 : 200;
        const buttonHeight = gameState.gameOver ? 60 : 50;
        const buttonX = canvas.width/2 - buttonWidth/2;
        const buttonY = gameState.gameOver ? canvas.height/2 + 50 : canvas.height/2 - buttonHeight/2;
        
        if (x >= buttonX && x <= buttonX + buttonWidth &&
            y >= buttonY && y <= buttonY + buttonHeight) {
            // Oyunu yeniden başlat
            startGame();
        }
    }
});

// Oyunu başlat
function startGame() {
    // Eğer önceki bir interval varsa temizle
    if (gameState.missileInterval) {
        clearInterval(gameState.missileInterval);
    }
    
    gameState.isPlaying = true;
    gameState.showMenu = false;
    gameState.gameOver = false;
    gameState.score = 0;
    gameState.explosionTime = 0;
    
    // Uçak ve yakıt istasyonlarını başlangıç konumlarına getir
    plane.x = canvas.width / 2;
    plane.y = canvas.height - 100;
    plane.fuel = 100;
    
    // Füzeleri temizle
    missiles.length = 0;
    explosionParticles.length = 0;
    
    fuelStations.forEach((station, index) => {
        station.x = 100 + (index * 200);
        station.y = index * 300;
    });
    
    // Yeni füze interval'i başlat
    gameState.missileInterval = setInterval(createMissile, MISSILE_SPAWN_RATE);
}

// Game Over durumunda veya oyun bittiğinde interval'i temizle
function endGame() {
    if (gameState.missileInterval) {
        clearInterval(gameState.missileInterval);
        gameState.missileInterval = null;
    }
    gameState.isPlaying = false;
    gameState.gameOver = true;
}

// Oyun döngüsü
function gameLoop() {
    if (!gameState.isPlaying) {
        if (gameState.gameOver) {
            drawOcean(); // Arka planı göster
            drawGameOver();
            // Patlama efektini göster
            if (Date.now() - gameState.explosionTime < EXPLOSION_DURATION) {
                drawExplosion();
            }
        } else {
            drawMenu();
        }
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Arka planı çiz
    drawOcean();
    
    // Füzeleri güncelle
    missiles.forEach((missile, index) => {
        missile.y += missile.speed;
        
        // Ekrandan çıkan füzeleri sil
        if (missile.y > canvas.height) {
            missiles.splice(index, 1);
            gameState.score += 10;
        }
        
        // Füze çarpışma kontrolü
        if (checkCollision(plane, missile)) {
            createExplosion(plane.x + plane.width/2, plane.y + plane.height/2);
            endGame(); // endGame fonksiyonunu çağır
        }
    });
    
    // Yakıt istasyonlarını güncelle
    updateFuelStations();
    
    // Uçağı hareket ettir (sadece yakıt varsa)
    if (plane.fuel > 0) {
        if (keys.ArrowLeft && plane.x > 0) plane.x -= plane.speed;
        if (keys.ArrowRight && plane.x < canvas.width - plane.width) plane.x += plane.speed;
        if (keys.ArrowUp && plane.y > 0) plane.y -= plane.speed;
        if (keys.ArrowDown && plane.y < canvas.height - plane.height) plane.y += plane.speed;
    } else {
        // Yakıt bittiğinde uçak düşmeye başlasın
        plane.y += BACKGROUND_SPEED * 2; // Düşme hızı
        
        // Ekranın altına ulaştığında patlama ve oyun sonu
        if (plane.y > canvas.height) {
            createExplosion(plane.x + plane.width/2, plane.y + plane.height/2);
            endGame(); // endGame fonksiyonunu çağır
        }
    }
    
    // Yakıt istasyonunda mı kontrol et
    plane.isRefueling = checkFuelStationCollision();
    
    // Yakıtı güncelle
    if (plane.isRefueling && plane.fuel < 100) {
        plane.fuel = Math.min(100, plane.fuel + FUEL_REFILL_RATE);
    } else if (plane.fuel > 0) {
        plane.fuel = Math.max(0, plane.fuel - FUEL_DECREASE_RATE);
    }
    
    // Yakıt göstergesini güncelle
    fuelLevelElement.style.width = `${plane.fuel}%`;
    fuelLevelElement.style.background = plane.fuel < 20 ? '#ff0000' : '#ffff00';
    
    // Yakıt istasyonlarını çiz
    drawFuelStations();
    
    // Füzeleri çiz
    drawMissiles();
    
    // Uçağı çiz (eğer patlama animasyonu yoksa)
    if (!gameState.gameOver) {
        drawPlane();
    }
    
    // Patlama efektini çiz
    if (gameState.gameOver && Date.now() - gameState.explosionTime < EXPLOSION_DURATION) {
        drawExplosion();
    }
    
    // Skoru göster
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Skor: ${gameState.score}`, 10, 30);
    
    requestAnimationFrame(gameLoop);
}

// Oyun döngüsünü başlat (menüden başlayacak)
gameLoop(); 