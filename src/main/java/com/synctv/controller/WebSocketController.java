// WebSocketController.java
package com.synctv.controller;

import com.synctv.model.Message;
import com.synctv.model.Room;
import com.synctv.model.User;
import com.synctv.service.RoomService;
import com.synctv.service.WebSocketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketController {

    @Autowired
    private WebSocketService webSocketService;

    @Autowired
    private RoomService roomService;

    @MessageMapping("/room/{roomId}/chat")
    public void sendMessage(@DestinationVariable String roomId, @Payload Message message) {
        message.setRoomId(roomId);
        message.setType(Message.MessageType.CHAT);
        webSocketService.sendMessageToRoom(roomId, message);
    }

    @MessageMapping("/room/{roomId}/join")
    public void joinRoom(@DestinationVariable String roomId, @Payload Message message,
                         SimpMessageHeaderAccessor headerAccessor) {
        // 获取WebSocket会话ID
        String sessionId = headerAccessor.getSessionId();

        // 创建用户对象
        User user = new User(message.getSender(), sessionId);

        // 将用户添加到房间
        Room room = roomService.addUserToRoom(roomId, user);

        if (room != null) {
            // 设置WebSocket会话属性
            headerAccessor.getSessionAttributes().put("username", message.getSender());
            headerAccessor.getSessionAttributes().put("roomId", roomId);

            // 广播用户加入消息
            message.setType(Message.MessageType.JOIN);
            message.setContent(message.getSender() + " 加入了房间");
            webSocketService.sendMessageToRoom(roomId, message);

            // 发送当前播放同步信息给新用户
            Message syncMessage = new Message();
            syncMessage.setType(Message.MessageType.SYNC_RESPONSE);
            syncMessage.setRoomId(roomId);
            syncMessage.setVideoTime(room.getCurrentTime());
            syncMessage.setPlaying(room.isPlaying());
            webSocketService.sendMessageToUser(sessionId, syncMessage);
        }
    }

    @MessageMapping("/room/{roomId}/leave")
    public void leaveRoom(@DestinationVariable String roomId, @Payload Message message,
                          SimpMessageHeaderAccessor headerAccessor) {
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        if (username != null) {
            User user = new User(username, headerAccessor.getSessionId());
            Room room = roomService.removeUserFromRoom(roomId, user);

            if (room != null) {
                message.setType(Message.MessageType.LEAVE);
                message.setSender(username);
                message.setContent(username + " 离开了房间");
                webSocketService.sendMessageToRoom(roomId, message);
            }
        }
    }

    @MessageMapping("/room/{roomId}/sync")
    public void syncPlayback(@DestinationVariable String roomId, @Payload Message message) {
        if (message.getType() == Message.MessageType.SYNC_REQUEST) {
            Room room = roomService.findRoomById(roomId);
            if (room != null) {
                Message syncResponse = new Message();
                syncResponse.setType(Message.MessageType.SYNC_RESPONSE);
                syncResponse.setRoomId(roomId);
                syncResponse.setVideoTime(room.getCurrentTime());
                syncResponse.setPlaying(room.isPlaying());

                webSocketService.sendMessageToUser(message.getSender(), syncResponse);
            }
        } else {
            roomService.updateRoomPlaybackStatus(roomId, message.isPlaying(), message.getVideoTime());
            webSocketService.sendMessageToRoom(roomId, message);
        }
    }

    @MessageMapping("/room/{roomId}/play")
    public void playVideo(@DestinationVariable String roomId, @Payload Message message) {
        message.setType(Message.MessageType.PLAY);
        roomService.updateRoomPlaybackStatus(roomId, true, message.getVideoTime());
        webSocketService.sendMessageToRoom(roomId, message);
    }

    @MessageMapping("/room/{roomId}/pause")
    public void pauseVideo(@DestinationVariable String roomId, @Payload Message message) {
        message.setType(Message.MessageType.PAUSE);
        roomService.updateRoomPlaybackStatus(roomId, false, message.getVideoTime());
        webSocketService.sendMessageToRoom(roomId, message);
    }
}