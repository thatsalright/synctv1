// RoomDTO.java
package com.synctv.dto;

import lombok.Data;
import java.util.HashSet;
import java.util.Set;

@Data
public class RoomDTO {
    private String id;
    private String name;
    private String videoUrl;
    private boolean isPlaying;
    private long currentTime;
    private Set<UserDTO> users = new HashSet<>();
}


