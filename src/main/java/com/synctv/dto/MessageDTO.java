// MessageDTO.java
package com.synctv.dto;

import com.synctv.model.Message.MessageType;
import lombok.Data;

@Data
public class MessageDTO {
    private MessageType type;
    private String content;
    private String sender;
    private String roomId;
    private long timestamp;
    private long videoTime;
    private boolean isPlaying;
}