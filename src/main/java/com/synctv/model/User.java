
// User.java
package com.synctv.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonBackReference;
import lombok.EqualsAndHashCode;
import lombok.Data;
import jakarta.persistence.*;

@Data
@Entity
@Table(name = "app_user") // 避免与数据库关键字冲突
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String sessionId;

    @JsonIgnore
    @EqualsAndHashCode.Exclude  // Add this annotation
    @ManyToOne(fetch = FetchType.LAZY)
    private Room room;

    public User() {
    }

    public User(String username, String sessionId) {
        this.username = username;
        this.sessionId = sessionId;
    }
}