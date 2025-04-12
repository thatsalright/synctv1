// RoomService.java
package com.synctv.service;

import com.synctv.model.Room;
import com.synctv.model.User;
import com.synctv.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class RoomService {

    @Autowired
    private RoomRepository roomRepository;

    public Room createRoom(String name, String videoUrl) {
        Room room = new Room();
        room.setName(name);
        room.setVideoUrl(videoUrl);
        return roomRepository.save(room);
    }

    public Room findRoomById(String id) {
        return roomRepository.findById(id).orElse(null);
    }

    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    public Room addUserToRoom(String roomId, User user) {
        Room room = findRoomById(roomId);
        if (room != null) {
            room.addUser(user);
            return roomRepository.save(room);
        }
        return null;
    }

    public Room removeUserFromRoom(String roomId, User user) {
        Room room = findRoomById(roomId);
        if (room != null) {
            room.removeUser(user);
            if (room.getUsers().isEmpty()) {
                roomRepository.delete(room);
                return null;
            }
            return roomRepository.save(room);
        }
        return null;
    }

    public Room updateRoomPlaybackStatus(String roomId, boolean isPlaying, long currentTime) {
        Room room = findRoomById(roomId);
        if (room != null) {
            room.setPlaying(isPlaying);
            room.setCurrentTime(currentTime);
            room.setLastUpdated(System.currentTimeMillis());
            return roomRepository.save(room);
        }
        return null;
    }
}
