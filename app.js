// ==================== 房车环游中国 - 虚拟Agent社区 ====================

// ==================== 1. 数据定义 ====================

// 4位团队成员
const TEAM_MEMBERS = {
    'JCL': {
        id: 'JCL',
        name: 'JCL',
        avatar: '🧑‍✈️',
        role: '主驾驶 / 领队',
        color: '#ff6b35',
        state: {
            location: '北京',
            coordinates: [39.9042, 116.4074],
            activity: '准备出发',
            food: '刚吃完早餐',
            mood: '兴奋',
            energy: 95,
            lastUpdate: new Date().toISOString()
        }
    },
    'PYJ': {
        id: 'PYJ',
        name: 'PYJ',
        avatar: '👩‍🍳',
        role: '厨师 / 后勤',
        color: '#f7931e',
        state: {
            location: '北京',
            coordinates: [39.9042, 116.4074],
            activity: '检查食材',
            food: '准备了三明治',
            mood: '开心',
            energy: 90,
            lastUpdate: new Date().toISOString()
        }
    },
    'LWJ': {
        id: 'LWJ',
        name: 'LWJ',
        avatar: '👨‍💻',
        role: '导航 / 记录',
        color: '#667eea',
        state: {
            location: '北京',
            coordinates: [39.9042, 116.4074],
            activity: '规划路线',
            food: '喝了咖啡',
            mood: '专注',
            energy: 88,
            lastUpdate: new Date().toISOString()
        }
    },
    'CYJ': {
        id: 'CYJ',
        name: 'CYJ',
        avatar: '👩‍📸',
        role: '摄影 / 社交',
        color: '#764ba2',
        state: {
            location: '北京',
            coordinates: [39.9042, 116.4074],
            activity: '整理设备',
            food: '吃了包子',
            mood: '期待',
            energy: 92,
            lastUpdate: new Date().toISOString()
        }
    }
};

// 旅行统计数据
const TRIP_STATS = {
    startDate: '2026-04-20',
    totalKm: 0,
    visitedProvinces: ['北京'],
    currentLocation: '北京',
    route: [
        { name: '北京', coordinates: [39.9042, 116.4074], date: '2026-04-20' }
    ]
};

// 旅行日志
let TRIP_LOGS = [
    {
        id: 'log_001',
        author: 'JCL',
        avatar: '🧑‍✈️',
        content: '房车环游中国，出发！🚐💨 四个人一辆车，准备走遍大江南北！',
        location: '北京',
        timestamp: new Date().toISOString(),
        type: 'milestone'
    }
];

// 当前登录用户
let currentUser = 'JCL';

// 是否是关注者模式（只读）
let isViewerMode = false;

// Leaflet地图实例
let map = null;
let rvMarker = null;
let routeLine = null;

// ==================== 2. 初始化 ====================

function init() {
    loadData();
    initMap();
    renderUserSwitcher();
    renderAgentCards();
    renderLogs();
    updateStats();
    checkViewerMode();

    // 绑定用户切换
    bindUserSwitch();

    console.log('🚐 房车环游中国 - 系统已启动');
    console.log('当前用户：', currentUser);
}

// ==================== 3. 地图功能 ====================

function initMap() {
    // 初始化地图，中心点设为当前位置
    const currentPos = TRIP_STATS.route[TRIP_STATS.route.length - 1].coordinates;

    map = L.map('map').setView(currentPos, 5);

    // 添加地图图层
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // 添加房车图标
    const rvIcon = L.divIcon({
        className: 'rv-marker',
        html: '<div style="font-size:32px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🚐</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });

    rvMarker = L.marker(currentPos, { icon: rvIcon }).addTo(map);
    rvMarker.bindPopup('<b>🚐 房车当前位置</b><br>' + TRIP_STATS.currentLocation);

    // 绘制已走路线
    updateRouteLine();

    // 点击地图更新位置（仅团队成员）
    map.on('click', function(e) {
        if (!isViewerMode) {
            updateLocation(e.latlng);
        }
    });
}

function updateRouteLine() {
    if (routeLine) {
        map.removeLayer(routeLine);
    }

    const routeCoords = TRIP_STATS.route.map(p => p.coordinates);
    if (routeCoords.length > 1) {
        routeLine = L.polyline(routeCoords, {
            color: '#667eea',
            weight: 4,
            opacity: 0.8,
            dashArray: '10, 10'
        }).addTo(map);
    }
}

function updateLocation(latlng) {
    // 反地理编码（简化版，实际应该调用API）
    const locationName = prompt('📍 请输入当前城市名称：', '');
    if (!locationName) return;

    // 更新房车位置
    rvMarker.setLatLng(latlng);
    rvMarker.setPopupContent('<b>🚐 房车当前位置</b><br>' + locationName);

    // 更新路线
    TRIP_STATS.route.push({
        name: locationName,
        coordinates: [latlng.lat, latlng.lng],
        date: new Date().toISOString().split('T')[0]
    });
    updateRouteLine();

    // 更新统计数据
    TRIP_STATS.currentLocation = locationName;
    if (!TRIP_STATS.visitedProvinces.includes(locationName)) {
        TRIP_STATS.visitedProvinces.push(locationName);
    }

    // 计算里程（简化计算，实际应该用实际路线距离）
    if (TRIP_STATS.route.length > 1) {
        const lastPos = TRIP_STATS.route[TRIP_STATS.route.length - 2].coordinates;
        const distance = calculateDistance(lastPos[0], lastPos[1], latlng.lat, latlng.lng);
        TRIP_STATS.totalKm += Math.round(distance);
    }

    // 更新当前用户的位置
    const user = TEAM_MEMBERS[currentUser];
    user.state.location = locationName;
    user.state.coordinates = [latlng.lat, latlng.lng];
    user.state.lastUpdate = new Date().toISOString();

    // 添加日志
    addLog({
        author: currentUser,
        avatar: user.avatar,
        content: `📍 到达新地点：${locationName}！`,
        location: locationName,
        type: 'location'
    });

    saveData();
    updateStats();
    renderAgentCards();
    renderLogs();

    // 移动地图视角
    map.setView(latlng, 8);
}

// 计算两点距离（简化版，单位km）
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ==================== 4. 渲染函数 ====================

function renderUserSwitcher() {
    const chips = document.querySelectorAll('.user-chip');
    chips.forEach(chip => {
        chip.classList.toggle('active', chip.dataset.user === currentUser);
    });
}

function renderAgentCards() {
    const container = document.getElementById('agentGrid');

    container.innerHTML = Object.values(TEAM_MEMBERS).map(member => {
        const isOwn = member.id === currentUser;
        const energyClass = member.state.energy > 70 ? 'energy-high' :
                           member.state.energy > 40 ? 'energy-medium' : 'energy-low';

        // 更新表单（仅自己的卡片显示）
        const updateForm = isOwn && !isViewerMode ? `
            <div class="update-form">
                <div class="form-row">
                    <input type="text" class="form-input" id="activityInput" placeholder="在做什么？" value="${member.state.activity}">
                </div>
                <div class="form-row">
                    <input type="text" class="form-input" id="foodInput" placeholder="正在吃什么？" value="${member.state.food}">
                </div>
                <div class="form-row">
                    <div class="mood-selector">
                        <button class="mood-btn ${member.state.mood === '兴奋' ? 'active' : ''}" data-mood="兴奋">🤩 兴奋</button>
                        <button class="mood-btn ${member.state.mood === '开心' ? 'active' : ''}" data-mood="开心">😊 开心</button>
                        <button class="mood-btn ${member.state.mood === '放松' ? 'active' : ''}" data-mood="放松">😌 放松</button>
                        <button class="mood-btn ${member.state.mood === '专注' ? 'active' : ''}" data-mood="专注">🤔 专注</button>
                        <button class="mood-btn ${member.state.mood === '疲惫' ? 'active' : ''}" data-mood="疲惫">😴 疲惫</button>
                    </div>
                </div>
                <button class="btn-update" onclick="updateStatus()">✨ 更新状态</button>
            </div>
        ` : '';

        return `
            <div class="agent-card ${isOwn ? 'own' : ''}">
                <div class="agent-header">
                    <div class="agent-avatar" style="background: ${member.color};">
                        ${member.avatar}
                    </div>
                    <div class="agent-info">
                        <h3>${member.name}</h3>
                        <div class="agent-role">${member.role}</div>
                    </div>
                    <div class="agent-status ${isOnline(member) ? 'status-online' : 'status-offline'}">
                        ${isOnline(member) ? '在线' : '离线'}
                    </div>
                </div>
                <div class="agent-details">
                    <div class="detail-row">
                        <span class="detail-icon">📍</span>
                        <span class="detail-label">位置</span>
                        <span class="detail-value">${member.state.location}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-icon">💭</span>
                        <span class="detail-label">活动</span>
                        <span class="detail-value">${member.state.activity}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-icon">🍜</span>
                        <span class="detail-label">餐饮</span>
                        <span class="detail-value">${member.state.food}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-icon">😊</span>
                        <span class="detail-label">心情</span>
                        <span class="detail-value">${member.state.mood}</span>
                    </div>
                </div>
                <div class="energy-bar">
                    <span class="detail-icon">⚡</span>
                    <div class="energy-track">
                        <div class="energy-fill ${energyClass}" style="width: ${member.state.energy}%"></div>
                    </div>
                    <span class="energy-text">${member.state.energy}%</span>
                </div>
                ${updateForm}
            </div>
        `;
    }).join('');

    // 绑定心情按钮
    if (!isViewerMode) {
        bindMoodButtons();
    }
}

function renderLogs() {
    const container = document.getElementById('logsContainer');

    if (TRIP_LOGS.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px;color:#999;">
                <div style="font-size:48px;margin-bottom:10px;">📝</div>
                <p>还没有旅行日志</p>
            </div>
        `;
        return;
    }

    const sortedLogs = [...TRIP_LOGS].sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
    );

    container.innerHTML = sortedLogs.map(log => {
        const time = new Date(log.timestamp).toLocaleString('zh-CN', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        return `
            <div class="log-item">
                <div class="log-avatar" style="background: ${TEAM_MEMBERS[log.author]?.color || '#ddd'};">
                    ${log.avatar}
                </div>
                <div class="log-content">
                    <div class="log-header">
                        <span class="log-author">${log.author}</span>
                        <span class="log-time">${time}</span>
                    </div>
                    <div class="log-text">${log.content}</div>
                    ${log.location ? `
                        <div class="log-location">
                            <span>📍</span>
                            <span>${log.location}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function updateStats() {
    // 计算旅行天数
    const start = new Date(TRIP_STATS.startDate);
    const now = new Date();
    const days = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;

    document.getElementById('statDays').textContent = `第${days}天`;
    document.getElementById('statKm').textContent = `${TRIP_STATS.totalKm.toLocaleString()} km`;
    document.getElementById('statProvinces').textContent = TRIP_STATS.visitedProvinces.length;
    document.getElementById('currentLocation').textContent = TRIP_STATS.currentLocation;
}

// ==================== 5. 辅助函数 ====================

function isOnline(member) {
    const lastUpdate = new Date(member.state.lastUpdate);
    const now = new Date();
    const diff = (now - lastUpdate) / (1000 * 60); // 分钟
    return diff < 30; // 30分钟内有更新算在线
}

function bindUserSwitch() {
    document.querySelectorAll('.user-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            if (isViewerMode) return;
            currentUser = this.dataset.user;
            renderUserSwitcher();
            renderAgentCards();
            saveData();
        });
    });
}

function bindMoodButtons() {
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// ==================== 6. 状态更新 ====================

function updateStatus() {
    const activity = document.getElementById('activityInput').value.trim();
    const food = document.getElementById('foodInput').value.trim();
    const mood = document.querySelector('.mood-btn.active')?.dataset.mood || '平静';

    if (!activity) {
        alert('请输入你在做什么~');
        return;
    }

    const user = TEAM_MEMBERS[currentUser];
    user.state.activity = activity;
    user.state.food = food;
    user.state.mood = mood;
    user.state.lastUpdate = new Date().toISOString();

    // 能量消耗/恢复逻辑
    if (activity.includes('休息') || activity.includes('睡觉')) {
        user.state.energy = Math.min(100, user.state.energy + 10);
    } else if (activity.includes('开车') || activity.includes('徒步')) {
        user.state.energy = Math.max(0, user.state.energy - 5);
    }

    addLog({
        author: currentUser,
        avatar: user.avatar,
        content: `${activity}${food ? '，' + food : ''}，心情${mood}`,
        location: user.state.location,
        type: 'status'
    });

    saveData();
    renderAgentCards();
    renderLogs();

    console.log('状态已更新：', user.state);
}

// ==================== 7. 日志功能 ====================

function addLog(logData) {
    TRIP_LOGS.push({
        id: 'log_' + Date.now(),
        timestamp: new Date().toISOString(),
        ...logData
    });

    // 限制日志数量
    if (TRIP_LOGS.length > 100) {
        TRIP_LOGS = TRIP_LOGS.slice(-100);
    }
}

function openPostModal() {
    if (isViewerMode) {
        alert('关注者模式下不能发布日志~');
        return;
    }
    document.getElementById('postModal').classList.add('active');
}

function closePostModal() {
    document.getElementById('postModal').classList.remove('active');
}

function submitPost() {
    const content = document.getElementById('postContent').value.trim();
    if (!content) {
        alert('请输入内容~');
        return;
    }

    const user = TEAM_MEMBERS[currentUser];
    addLog({
        author: currentUser,
        avatar: user.avatar,
        content: content,
        location: user.state.location,
        type: 'post'
    });

    saveData();
    renderLogs();
    closePostModal();
    document.getElementById('postContent').value = '';
}

// ==================== 8. 数据持久化 ====================

function saveData() {
    localStorage.setItem('rv_adventure_data', JSON.stringify({
        team: TEAM_MEMBERS,
        stats: TRIP_STATS,
        logs: TRIP_LOGS,
        currentUser,
        lastSave: new Date().toISOString()
    }));
}

function loadData() {
    const saved = localStorage.getItem('rv_adventure_data');
    if (saved) {
        const data = JSON.parse(saved);

        // 恢复团队成员状态
        Object.keys(data.team || {}).forEach(key => {
            if (TEAM_MEMBERS[key]) {
                TEAM_MEMBERS[key].state = data.team[key].state;
            }
        });

        // 恢复统计数据
        if (data.stats) {
            TRIP_STATS.totalKm = data.stats.totalKm || 0;
            TRIP_STATS.visitedProvinces = data.stats.visitedProvinces || ['北京'];
            TRIP_STATS.currentLocation = data.stats.currentLocation || '北京';
            TRIP_STATS.route = data.stats.route || TRIP_STATS.route;
        }

        // 恢复日志
        TRIP_LOGS = data.logs || TRIP_LOGS;

        // 恢复当前用户
        if (data.currentUser && TEAM_MEMBERS[data.currentUser]) {
            currentUser = data.currentUser;
        }
    }
}

// ==================== 9. 关注者模式 ====================

function checkViewerMode() {
    // 检测URL参数，如果有 ?view=1 则为关注者模式
    const urlParams = new URLSearchParams(window.location.search);
    isViewerMode = urlParams.has('view');

    if (isViewerMode) {
        document.getElementById('viewerMode').style.display = 'block';
        document.getElementById('userSwitcher').style.display = 'none';
        document.getElementById('btnPost').style.display = 'none';

        // 隐藏所有更新表单
        document.querySelectorAll('.update-form').forEach(el => el.style.display = 'none');
    }
}

// ==================== 10. 启动 ====================

document.addEventListener('DOMContentLoaded', init);

// 定期同步数据（每10秒）
setInterval(() => {
    loadData();
    renderAgentCards();
    renderLogs();
    updateStats();
    updateRouteLine();
}, 10000);

// 导出全局函数
window.updateStatus = updateStatus;
window.openPostModal = openPostModal;
window.closePostModal = closePostModal;
window.submitPost = submitPost;

console.log('🚐 脚本加载完成');
