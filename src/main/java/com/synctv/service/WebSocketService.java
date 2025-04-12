
// WebSocketService.java
package com.synctv.service;

import com.synctv.model.Message;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void sendMessageToRoom(String roomId, Message message) {
        messagingTemplate.convertAndSend("/topic/room/" + roomId, message);
    }

    public void sendMessageToUser(String sessionId, Message message) {
        messagingTemplate.convertAndSendToUser(sessionId, "/queue/messages", message);
    }
}