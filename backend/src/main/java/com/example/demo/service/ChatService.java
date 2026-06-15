package com.example.demo.service;

import com.example.demo.entity.ChatSession;
import com.example.demo.entity.Message;
import com.example.demo.entity.User;
import com.example.demo.repository.ChatSessionRepository;
import com.example.demo.repository.MessageRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * -----------------------------------------------------------------------------
 * SERVICE LAYER (The "Brain" of the operation)
 * -----------------------------------------------------------------------------
 * Why do we need a Service?
 * In a professional Spring Boot app, we separate our code into 3 layers:
 * 1. Controller: Receives the HTTP request (like a receptionist).
 * 2. Service: Contains all the "Business Logic" and rules (like the manager).
 * 3. Repository: Talks directly to the MySQL database (like the filing clerk).
 * 
 * By keeping them separate, the code is much easier to read, test, and maintain!
 */
@Service
public class ChatService {

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Helper method to get the currently logged-in user from Spring Security's context.
     * We need this to make sure users only see their own chats!
     */
    public User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        
        // Check how Spring Security stored the user details
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }
        
        // Look up the user in the database
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));
    }

    /**
     * Fetch the 30 most recent chat sessions for the logged-in user.
     */
    public List<ChatSession> getUserChats() {
        User user = getCurrentUser();
        // Ask the repository to do the heavy lifting of fetching the latest 30
        return chatSessionRepository.findTop30ByUserOrderByCreatedAtDesc(user);
    }

    /**
     * Create a brand new ChatSession.
     */
    public ChatSession createChatSession(String title) {
        User user = getCurrentUser();
        
        ChatSession chatSession = new ChatSession();
        chatSession.setTitle(title);
        chatSession.setUser(user); // Link the chat to the specific user!
        
        // Save to database
        return chatSessionRepository.save(chatSession);
    }

    /**
     * Fetch all messages inside a specific ChatSession.
     */
    public List<Message> getChatMessages(Long chatId) {
        // 1. Find the chat in the database
        ChatSession chatSession = chatSessionRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Error: Chat not found."));
        
        // 2. Security Check: Make sure this user actually owns the chat!
        // We don't want someone hacking the URL and viewing someone else's conversation.
        User user = getCurrentUser();
        if (!chatSession.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Security Violation: You do not have permission to view this chat.");
        }

        // 3. Return the messages
        return messageRepository.findByChatSessionOrderByTimestampAsc(chatSession);
    }

    /**
     * Add a new Message (from the user or the AI model) to an existing ChatSession.
     */
    public Message addMessage(Long chatId, String role, String text, String imageBase64) {
        // 1. Find the chat in the database
        ChatSession chatSession = chatSessionRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Error: Chat not found."));
        
        // 2. Security Check: Make sure this user actually owns the chat!
        User user = getCurrentUser();
        if (!chatSession.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Security Violation: You do not have permission to modify this chat.");
        }

        // 3. Create and save the new message
        Message message = new Message();
        message.setRole(role); // "user" or "model"
        message.setText(text);
        message.setImageBase64(imageBase64);
        message.setChatSession(chatSession);
        
        return messageRepository.save(message);
    }
}
