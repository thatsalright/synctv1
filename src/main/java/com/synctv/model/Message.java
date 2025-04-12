// Message.java
package com.synctv.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Message {
    private MessageType type;
    private String content;
    private String sender;
    private String roomId;
    private long timestamp;
    private long videoTime;
    private boolean isPlaying;

    public enum MessageType {
        CHAT, JOIN, LEAVE, SYNC_REQUEST, SYNC_RESPONSE, PLAY, PAUSE
    }

    public Message() {
        this.timestamp = System.currentTimeMillis();
    }
}