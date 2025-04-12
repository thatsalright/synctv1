// RoomController.java
package com.synctv.controller;

import com.synctv.dto.RoomDTO;
import com.synctv.model.Room;
import com.synctv.model.User;
import com.synctv.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    @Autowired
    private RoomService roomService;

    @PostMapping
    public ResponseEntity<Room> createRoom(@RequestParam String name, @RequestParam String videoUrl) {
        return ResponseEntity.ok(roomService.createRoom(name, videoUrl));
    }

    @GetMapping
    public ResponseEntity<List<Room>> getAllRooms() {
        return ResponseEntity.ok(roomService.getAllRooms());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Room> getRoomById(@PathVariable String id) {
        Room room = roomService.findRoomById(id);
        if (room != null) {
            return ResponseEntity.ok(room);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<Room> joinRoom(@PathVariable String id, @RequestBody User user) {
        Room room = roomService.addUserToRoom(id, user);
        if (room != null) {
            return ResponseEntity.ok(room);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<?> leaveRoom(@PathVariable String id, @RequestBody User user) {
        Room room = roomService.removeUserFromRoom(id, user);
        if (room != null) {
            return ResponseEntity.ok(room);
        } else if (roomService.findRoomById(id) == null) {
            return ResponseEntity.ok().body("Room deleted as it has no users.");
        }
        return ResponseEntity.notFound().build();
    }
}

