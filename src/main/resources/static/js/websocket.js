let stompClient = null;

// 连接到WebSocket
function connectToWebSocket(roomId) {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function(frame) {
        console.log('已连接到WebSocket: ' + frame);

        // 订阅房间广播消息
        stompClient.subscribe(`/topic/room/${roomId}`, function(message) {
            handleMessage(JSON.parse(message.body));
        });

        // 订阅个人消息
        stompClient.subscribe(`/user/queue/messages`, function(message) {
            handleMessage(JSON.parse(message.body));
        });

        // 发送加入房间消息
        const joinMessage = {
            type: 'JOIN',
            sender: currentUser.username,
            roomId: roomId,
            timestamp: Date.now()
        };

        stompClient.send(`/app/room/${roomId}/join`, {}, JSON.stringify(joinMessage));
    }, function(error) {
        console.error('WebSocket连接失败:', error);
        alert('连接失败，请重试');
        resetUI();
    });
}

// 断开WebSocket连接
function disconnectWebSocket() {
    if (stompClient !== null) {
        stompClient.disconnect();
        stompClient = null;
        console.log('已断开WebSocket连接');
    }
}

// 处理接收到的WebSocket消息
function handleMessage(message) {
    console.log('收到消息:', message);

    switch (message.type) {
        case 'CHAT':
            addChatMessage(message);
            break;

        case 'JOIN':
        case 'LEAVE':
            addChatMessage(message);
            // 重新获取房间信息以更新用户列表
            fetch(`/api/rooms/${currentUser.roomId}`)
                .then(response => response.json())
                .then(room => {
                    updateUserList(room.users);
                })
                .catch(error => console.error('获取房间信息失败:', error));
            break;

        case 'SYNC_RESPONSE':
            // 处理同步响应
            const videoPlayer = document.getElementById('video-player');

            // 如果时间差超过2秒，同步播放进度
            if (Math.abs(videoPlayer.currentTime - message.videoTime) > 2) {
                videoPlayer.currentTime = message.videoTime;
            }

            // 同步播放状态
            if (message.isPlaying && videoPlayer.paused) {
                // 避免因为播放状态变化触发新的消息
                videoPlayer.removeEventListener('play', onPlay);
                videoPlayer.play()
                    .then(() => {
                        // 重新添加事件监听器
                        setTimeout(() => {
                            videoPlayer.addEventListener('play', onPlay);
                        }, 500);
                    })
                    .catch(error => console.error('播放失败:', error));
            } else if (!message.isPlaying && !videoPlayer.paused) {
                // 避免因为暂停状态变化触发新的消息
                videoPlayer.removeEventListener('pause', onPause);
                videoPlayer.pause();
                // 重新添加事件监听器
                setTimeout(() => {
                    videoPlayer.addEventListener('pause', onPause);
                }, 500);
            }
            break;

        case 'PLAY':
            const playMsg = `${message.sender} 开始播放视频`;
            addSystemMessage(playMsg);

            // 如果不是当前用户触发的播放，则同步播放状态
            if (message.sender !== currentUser.username) {
                const videoPlayer = document.getElementById('video-player');
                videoPlayer.currentTime = message.videoTime;
                videoPlayer.removeEventListener('play', onPlay);
                videoPlayer.play()
                    .then(() => {
                        setTimeout(() => {
                            videoPlayer.addEventListener('play', onPlay);
                        }, 500);
                    })
                    .catch(error => console.error('播放失败:', error));
            }
            break;

        case 'PAUSE':
            const pauseMsg = `${message.sender} 暂停了视频`;
            addSystemMessage(pauseMsg);

            // 如果不是当前用户触发的暂停，则同步暂停状态
            if (message.sender !== currentUser.username) {
                const videoPlayer = document.getElementById('video-player');
                videoPlayer.currentTime = message.videoTime;
                videoPlayer.removeEventListener('pause', onPause);
                videoPlayer.pause();
                setTimeout(() => {
                    videoPlayer.addEventListener('pause', onPause);
                }, 500);
            }
            break;
    }
}

// 添加系统消息
function addSystemMessage(content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = content;

    const chatMessages = document.getElementById('chat-messages');
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 视频播放事件处理函数
function onPlay() {
    if (stompClient && stompClient.connected) {
        const videoPlayer = document.getElementById('video-player');
        const playMessage = {
            type: 'PLAY',
            sender: currentUser.username,
            roomId: currentUser.roomId,
            videoTime: videoPlayer.currentTime,
            isPlaying: true,
            timestamp: Date.now()
        };

        stompClient.send(`/app/room/${currentUser.roomId}/play`, {}, JSON.stringify(playMessage));
    }
}

// 视频暂停事件处理函数
function onPause() {
    if (stompClient && stompClient.connected) {
        const videoPlayer = document.getElementById('video-player');
        const pauseMessage = {
            type: 'PAUSE',
            sender: currentUser.username,
            roomId: currentUser.roomId,
            videoTime: videoPlayer.currentTime,
            isPlaying: false,
            timestamp: Date.now()
        };

        stompClient.send(`/app/room/${currentUser.roomId}/pause`, {}, JSON.stringify(pauseMessage));
    }
}

// 在window对象上添加事件处理函数，以便在app.js中使用
window.onPlay = onPlay;
window.onPause = onPause;