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

    // 添加房车图标（可点击）
    const rvIcon = L.divIcon({
        className: 'rv-marker rv-marker-clickable',
        html: '<div style="font-size:48px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.4));cursor:pointer;animation:bounce 2s infinite;" title="🖱️ 点击进入房车内部">🚐</div>',
        iconSize: [48, 48],
        iconAnchor: [24, 24]
    });

    rvMarker = L.marker(currentPos, { icon: rvIcon }).addTo(map);

    // 点击房车打开内部场景（绑定到div元素）
    setTimeout(() => {
        const rvElement = document.querySelector('.rv-marker-clickable');
        if (rvElement) {
            rvElement.style.cursor = 'pointer';
            rvElement.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('🚐 房车被点击了！');
                openRVInterior();
            });
        }
    }, 500);

    // Leaflet 的点击事件也绑定
    rvMarker.on('click', function(e) {
        L.DomEvent.stopPropagation(e);
        console.log('🚐 房车marker被点击');
        openRVInterior();
    });

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
                    <div class="detail-row activity">
                        <span class="detail-icon">💭</span>
                        <span class="detail-label">正在做</span>
                        <span class="detail-value activity-text">${member.state.activity}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-icon">📍</span>
                        <span class="detail-label">位置</span>
                        <span class="detail-value">${member.state.location}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-icon">🍜</span>
                        <span class="detail-label">饮食</span>
                        <span class="detail-value">${member.state.food}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-icon">😊</span>
                        <span class="detail-label">心情</span>
                        <span class="detail-value">${member.state.mood}</span>
                    </div>
                </div>
                <button class="view-details-btn" onclick="viewAgentTimeline('${member.id}')">📋 查看活动记录</button>
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

// ==================== 11. 个人活动时间轴 ====================

let currentTimelineAgent = null;
let currentTimelineFilter = 'all';

function viewAgentTimeline(agentId) {
    currentTimelineAgent = agentId;
    const agent = TEAM_MEMBERS[agentId];

    document.getElementById('timelineTitle').innerHTML = `
        ${agent.avatar} ${agent.name} 的活动记录
    `;

    renderTimeline();
    document.getElementById('timelineModal').classList.add('active');

    // 绑定筛选按钮
    bindTimelineFilters();
}

function closeTimelineModal() {
    document.getElementById('timelineModal').classList.remove('active');
    currentTimelineAgent = null;
}

function bindTimelineFilters() {
    document.querySelectorAll('.timeline-filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.timeline-filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentTimelineFilter = this.dataset.filter;
            renderTimeline();
        });
    });
}

function renderTimeline() {
    const container = document.getElementById('agentTimeline');

    // 筛选该Agent的日志
    let agentLogs = TRIP_LOGS.filter(log => log.author === currentTimelineAgent);

    // 应用筛选
    if (currentTimelineFilter !== 'all') {
        agentLogs = agentLogs.filter(log => log.type === currentTimelineFilter);
    }

    // 按时间倒序
    agentLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (agentLogs.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px;color:#999;">
                <div style="font-size:48px;margin-bottom:10px;">📭</div>
                <p>暂无活动记录</p>
            </div>
        `;
        return;
    }

    container.innerHTML = agentLogs.map(log => {
        const time = new Date(log.timestamp).toLocaleString('zh-CN', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const agent = TEAM_MEMBERS[log.author];

        let typeIcon = '📝';
        let typeClass = '';
        if (log.type === 'location') { typeIcon = '📍'; typeClass = 'milestone'; }
        if (log.type === 'status') { typeIcon = '💭'; }
        if (log.type === 'milestone') { typeIcon = '🎉'; typeClass = 'milestone'; }

        return `
            <div class="timeline-item ${typeClass}">
                <div class="timeline-time">${time}</div>
                <div class="timeline-content">${typeIcon} ${log.content}</div>
                <div class="timeline-meta">
                    <span class="timeline-agent" style="color: ${agent.color};">
                        ${agent.avatar} ${agent.name}
                    </span>
                    ${log.location ? `<span>📍 ${log.location}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ==================== 12. 房车内部像素场景 ====================

function openRVInterior() {
    renderRVInterior();
    document.getElementById('rvInteriorModal').classList.add('active');
}

function closeRVInterior() {
    document.getElementById('rvInteriorModal').classList.remove('active');
}

function renderRVInterior() {
    const container = document.getElementById('rvInteriorContainer');

    // 获取每个人当前的状态
    const getActivity = (member) => {
        return member.state.activity || '休息中';
    };

    container.innerHTML = `
        <div class="rv-interior-scene">
            <button class="rv-interior-close" onclick="closeRVInterior()">✕ 关闭</button>
            <h2 class="rv-interior-title">🚐 房车内部 - 实时看板</h2>

            <!-- 窗户 -->
            <div class="pixel-window" style="left: 20px;"></div>
            <div class="pixel-window" style="right: 20px;"></div>

            <!-- 家具 -->
            <div class="pixel-furniture pixel-sofa"></div>
            <div class="pixel-furniture pixel-table"></div>

            <!-- 地板 -->
            <div class="pixel-floor"></div>

            <!-- JCL - 驾驶座区域 -->
            <div class="rv-pixel-person rv-person-jcl" style="top: 100px; left: 40px;">
                <div class="rv-status-bubble">${getActivity(TEAM_MEMBERS.JCL)}</div>
                <div class="rv-pixel-avatar">
                    <div class="rv-pixel-head">
                        ${Array(10).fill('<div class="rv-pixel"></div>').join('')}
                    </div>
                    <div class="rv-pixel-body">
                        ${Array(13).fill('<div class="rv-pixel"></div>').join('')}
                    </div>
                </div>
                <div class="rv-name-tag">JCL</div>
            </div>

            <!-- PYJ - 厨房区域 -->
            <div class="rv-pixel-person rv-person-pyj" style="top: 100px; right: 50px;">
                <div class="rv-status-bubble">${getActivity(TEAM_MEMBERS.PYJ)}</div>
                <div class="rv-pixel-avatar">
                    <div class="rv-pixel-head">
                        ${Array(10).fill('<div class="rv-pixel"></div>').join('')}
                    </div>
                    <div class="rv-pixel-body">
                        ${Array(13).fill('<div class="rv-pixel"></div>').join('')}
                    </div>
                </div>
                <div class="rv-name-tag">PYJ</div>
            </div>

            <!-- LWJ - 桌子旁 -->
            <div class="rv-pixel-person rv-person-lwj" style="bottom: 100px; left: 50%; transform: translateX(-50%);">
                <div class="rv-status-bubble">${getActivity(TEAM_MEMBERS.LWJ)}</div>
                <div class="rv-pixel-avatar">
                    <div class="rv-pixel-head">
                        ${Array(10).fill('<div class="rv-pixel"></div>').join('')}
                    </div>
                    <div class="rv-pixel-body">
                        ${Array(13).fill('<div class="rv-pixel"></div>').join('')}
                    </div>
                </div>
                <div class="rv-name-tag">LWJ</div>
            </div>

            <!-- CYJ - 沙发区 -->
            <div class="rv-pixel-person rv-person-cyj" style="bottom: 100px; right: 70px;">
                <div class="rv-status-bubble">${getActivity(TEAM_MEMBERS.CYJ)}</div>
                <div class="rv-pixel-avatar">
                    <div class="rv-pixel-head">
                        ${Array(10).fill('<div class="rv-pixel"></div>').join('')}
                    </div>
                    <div class="rv-pixel-body">
                        ${Array(13).fill('<div class="rv-pixel"></div>').join('')}
                    </div>
                </div>
                <div class="rv-name-tag">CYJ</div>
            </div>
        </div>
    `;
}

// 导出全局函数
window.updateStatus = updateStatus;
window.openPostModal = openPostModal;
window.closePostModal = closePostModal;
window.submitPost = submitPost;
window.viewAgentTimeline = viewAgentTimeline;
window.closeTimelineModal = closeTimelineModal;
window.openRVInterior = openRVInterior;
window.closeRVInterior = closeRVInterior;

console.log('🚐 脚本加载完成');
