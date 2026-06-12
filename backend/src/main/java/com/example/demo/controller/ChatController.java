package com.example.demo.controller;

import com.example.demo.entity.ChatSession;
import com.example.demo.entity.Message;
import com.example.demo.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * -----------------------------------------------------------------------------
 * CONTROLLER LAYER (The "Receptionist")
 * -----------------------------------------------------------------------------
 * Why do we need a Controller?
 * The Controller's ONLY job is to listen for incoming HTTP requests from your React frontend 
 * (like a GET or POST request), hand the information over to the Service layer to do the actual work, 
 * and then return the final result back to React.
 * 
 * Notice how clean and simple this file is now! It doesn't contain any database logic.
 */
@RestController
@RequestMapping("/api/chats")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ChatController {

    // We automatically connect (inject) our new ChatService here.
    @Autowired
    private ChatService chatService;

    // 1. Endpoint to get all chats for the sidebar
    @GetMapping
    public ResponseEntity<List<ChatSession>> getUserChats() {
        // The controller just asks the service for the data and returns it!
        List<ChatSession> chats = chatService.getUserChats();
        return ResponseEntity.ok(chats);
    }

    // 2. Endpoint to create a new chat when the user types their first prompt
    @PostMapping
    public ResponseEntity<ChatSession> createChatSession(@RequestBody Map<String, String> payload) {
        String title = payload.get("title");
        ChatSession newSession = chatService.createChatSession(title);
        return ResponseEntity.ok(newSession);
    }

    // 3. Endpoint to load all older messages when the user clicks a chat in the sidebar
    @GetMapping("/{chatId}/messages")
    public ResponseEntity<?> getChatMessages(@PathVariable Long chatId) {
        try {
            List<Message> messages = chatService.getChatMessages(chatId);
            return ResponseEntity.ok(messages);
        } catch (RuntimeException e) {
            // If there's an error (like a user trying to view someone else's chat), return a 403 Forbidden
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    // 4. Endpoint to save a new text bubble (message) into an existing chat
    @PostMapping("/{chatId}/messages")
    public ResponseEntity<?> addMessage(@PathVariable Long chatId, @RequestBody Map<String, String> payload) {
        try {
            String role = payload.get("role");
            String text = payload.get("text");
            Message newMessage = chatService.addMessage(chatId, role, text);
            return ResponseEntity.ok(newMessage);
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }
}
