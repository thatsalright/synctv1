// 全局变量
let currentUser = {
    username: '',
    roomId: null
};

// DOM 元素引用
const elements = {
    startPanel: document.getElementById('start-panel'),
    roomPanel: document.getElementById('room-panel'),
    createRoomPanel: document.getElementById('create-room-panel'),

    // 输入元素
    usernameInput: document.getElementById('username'),
    roomIdInput: document.getElementById('room-id'),
    roomNameInput: document.getElementById('room-name'),
    videoUrlInput: document.getElementById('video-url'),
    chatInput: document.getElementById('chat-input'),

    // 按钮
    createRoomBtn: document.getElementById('create-room-btn'),
    joinRoomBtn: document.getElementById('join-room-btn'),
    confirmCreateRoomBtn: document.getElementById('confirm-create-room'),
    syncBtn: document.getElementById('sync-btn'),
    leaveRoomBtn: document.getElementById('leave-room-btn'),
    sendBtn: document.getElementById('send-btn'),

    // 显示元素
    roomNameDisplay: document.getElementById('room-name-display'),
    roomIdDisplay: document.getElementById('room-id-display'),
    userList: document.getElementById('user-list'),
    chatMessages: document.getElementById('chat-messages'),
    videoPlayer: document.getElementById('video-player'),
    videoSource: document.getElementById('video-source')
};

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    // 创建房间按钮点击
    elements.createRoomBtn.addEventListener('click', () => {
        if (!validateUsername()) return;
        elements.createRoomPanel.classList.remove('d-none');
    });

    // 确认创建房间按钮点击
    elements.confirmCreateRoomBtn.addEventListener('click', createRoom);

    // 加入房间按钮点击
    elements.joinRoomBtn.addEventListener('click', joinExistingRoom);

    // 同步按钮点击
    elements.syncBtn.addEventListener('click', requestSync);

    // 离开房间按钮点击
    elements.leaveRoomBtn.addEventListener('click', leaveRoom);

    // 发送消息按钮点击
    elements.sendBtn.addEventListener('click', sendChatMessage);

    // 聊天输入框回车键
    elements.chatInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });

    // 视频播放器事件
    setupVideoPlayerEvents();
}

// 验证用户名是否有效
function validateUsername() {
    const username = elements.usernameInput.value.trim();
    if (!username) {
        alert('请输入昵称');
        elements.usernameInput.focus();
        return false;
    }
    currentUser.username = username;
    return true;
}

// 创建新房间
function createRoom() {
    const roomName = elements.roomNameInput.value.trim();
    const videoUrl = elements.videoUrlInput.value.trim();

    if (!roomName) {
        alert('请输入房间名称');
        elements.roomNameInput.focus();
        return;
    }

    if (!videoUrl) {
        alert('请输入视频URL');
        elements.videoUrlInput.focus();
        return;
    }

    // 创建房间API请求
    fetch('/api/rooms?name=' + encodeURIComponent(roomName) + '&videoUrl=' + encodeURIComponent(videoUrl), {
        method: 'POST'
    })
        .then(response => response.json())
        .then(room => {
            currentUser.roomId = room.id;
            // 切换到房间页面并连接WebSocket
            enterRoom(room);
        })
        .catch(error => {
            console.error('创建房间失败:', error);
            alert('创建房间失败，请重试');
        });
}

// 加入现有房间
function joinExistingRoom() {
    if (!validateUsername()) return;

    const roomId = elements.roomIdInput.value.trim();
    if (!roomId) {
        alert('请输入房间ID');
        elements.roomIdInput.focus();
        return;
    }

    // 获取房间信息API请求
    fetch('/api/rooms/' + encodeURIComponent(roomId))
        .then(response => {
            if (!response.ok) {
                throw new Error('房间未找到');
            }
            return response.json();
        })
        .then(room => {
            currentUser.roomId = room.id;
            // 切换到房间页面并连接WebSocket
            enterRoom(room);
        })
        .catch(error => {
            console.error('加入房间失败:', error);
            alert('加入房间失败，请检查房间ID是否正确');
        });
}

// 进入房间
function enterRoom(room) {
    // 更新界面
    elements.roomNameDisplay.textContent = room.name;
    elements.roomIdDisplay.textContent = 'ID: ' + room.id;

    // 设置视频源
    elements.videoSource.src = room.videoUrl;
    elements.videoPlayer.load();

    // 显示房间面板，隐藏开始面板
    elements.startPanel.classList.add('d-none');
    elements.roomPanel.classList.remove('d-none');

    // 连接WebSocket
    connectToWebSocket(room.id);
}

// 请求同步播放进度
function requestSync() {
    if (stompClient && stompClient.connected) {
        const syncRequestMessage = {
            type: 'SYNC_REQUEST',
            sender: currentUser.username,
            roomId: currentUser.roomId,
            timestamp: Date.now()
        };

        stompClient.send(`/app/room/${currentUser.roomId}/sync`, {}, JSON.stringify(syncRequestMessage));
    }
}

// 发送聊天消息
function sendChatMessage() {
    const content = elements.chatInput.value.trim();
    if (!content || !stompClient || !stompClient.connected) return;

    const chatMessage = {
        type: 'CHAT',
        content: content,
        sender: currentUser.username,
        roomId: currentUser.roomId,
        timestamp: Date.now()
    };

    stompClient.send(`/app/room/${currentUser.roomId}/chat`, {}, JSON.stringify(chatMessage));
    elements.chatInput.value = '';
}

// 离开房间
function leaveRoom() {
    if (stompClient && stompClient.connected) {
        const leaveMessage = {
            type: 'LEAVE',
            sender: currentUser.username,
            roomId: currentUser.roomId,
            timestamp: Date.now()
        };

        stompClient.send(`/app/room/${currentUser.roomId}/leave`, {}, JSON.stringify(leaveMessage));
        disconnectWebSocket();
    }

    // 重置UI
    resetUI();
}

// 重置UI到初始状态
function resetUI() {
    elements.roomPanel.classList.add('d-none');
    elements.startPanel.classList.remove('d-none');
    elements.createRoomPanel.classList.add('d-none');

    // 清空输入框
    elements.roomIdInput.value = '';
    elements.roomNameInput.value = '';
    elements.videoUrlInput.value = '';
    elements.chatInput.value = '';

    // 清空聊天消息和用户列表
    elements.chatMessages.innerHTML = '';
    elements.userList.innerHTML = '';

    // 停止视频播放
    elements.videoPlayer.pause();
    elements.videoSource.src = '';
    elements.videoPlayer.load();

    // 重置当前用户状态
    currentUser.roomId = null;
}

// 设置视频播放器事件
function setupVideoPlayerEvents() {
    // 播放事件
    elements.videoPlayer.addEventListener('play', () => {
        if (stompClient && stompClient.connected) {
            const playMessage = {
                type: 'PLAY',
                sender: currentUser.username,
                roomId: currentUser.roomId,
                videoTime: elements.videoPlayer.currentTime,
                isPlaying: true,
                timestamp: Date.now()
            };

            stompClient.send(`/app/room/${currentUser.roomId}/play`, {}, JSON.stringify(playMessage));
        }
    });

    // 暂停事件
    elements.videoPlayer.addEventListener('pause', () => {
        if (stompClient && stompClient.connected) {
            const pauseMessage = {
                type: 'PAUSE',
                sender: currentUser.username,
                roomId: currentUser.roomId,
                videoTime: elements.videoPlayer.currentTime,
                isPlaying: false,
                timestamp: Date.now()
            };

            stompClient.send(`/app/room/${currentUser.roomId}/pause`, {}, JSON.stringify(pauseMessage));
        }
    });

    // 定期发送进度更新
    setInterval(() => {
        if (stompClient && stompClient.connected && !elements.videoPlayer.paused) {
            const syncMessage = {
                type: 'SYNC_RESPONSE',
                sender: currentUser.username,
                roomId: currentUser.roomId,
                videoTime: elements.videoPlayer.currentTime,
                isPlaying: !elements.videoPlayer.paused,
                timestamp: Date.now()
            };

            stompClient.send(`/app/room/${currentUser.roomId}/sync`, {}, JSON.stringify(syncMessage));
        }
    }, 10000); // 每10秒同步一次
}

// 更新用户列表
function updateUserList(users) {
    elements.userList.innerHTML = '';
    users.forEach(user => {
        const userItem = document.createElement('li');
        userItem.className = 'list-group-item';
        userItem.textContent = user.username;
        if (user.username === currentUser.username) {
            userItem.className += ' active';
        }
        elements.userList.appendChild(userItem);
    });
}

// 添加聊天消息
function addChatMessage(message) {
    const messageDiv = document.createElement('div');

    if (message.type === 'JOIN' || message.type === 'LEAVE') {
        messageDiv.className = 'system-message';
        messageDiv.textContent = message.content;
    } else {
        messageDiv.className = 'chat-message';
        if (message.sender === currentUser.username) {
            messageDiv.className += ' user-message';
        } else {
            messageDiv.className += ' other-message';
        }

        const senderSpan = document.createElement('span');
        senderSpan.className = 'sender';
        senderSpan.textContent = message.sender;

        const timeSpan = document.createElement('span');
        timeSpan.className = 'timestamp';
        timeSpan.textContent = new Date(message.timestamp).toLocaleTimeString();

        const contentSpan = document.createElement('span');
        contentSpan.className = 'content';
        contentSpan.textContent = message.content;

        messageDiv.appendChild(senderSpan);
        messageDiv.appendChild(timeSpan);
        messageDiv.appendChild(contentSpan);
    }

    elements.chatMessages.appendChild(messageDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}