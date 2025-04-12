// Room.java
package com.synctv.model;


import lombok.Data;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Data
@Entity
public class Room {
    @Id
    private String id;

    private String name;
    private String videoUrl;

    @Column(name = "video_current_time")  // 修改列名
    private long currentTime;

    @Column(name = "is_playing")
    private boolean isPlaying;

    @Column(name = "last_updated_time")
    private long lastUpdated;



    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<User> users = new HashSet<>();

    public Room() {
        this.id = UUID.randomUUID().toString().substring(0, 6);
        this.isPlaying = false;
        this.currentTime = 0;
        this.lastUpdated = System.currentTimeMillis();
    }

    public void addUser(User user) {
        users.add(user);
        user.setRoom(this);
    }

    public void removeUser(User user) {
        users.remove(user);
        user.setRoom(null);
    }
}


