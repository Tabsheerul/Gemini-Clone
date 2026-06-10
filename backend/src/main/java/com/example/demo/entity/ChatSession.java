package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_sessions")
@Data
public class ChatSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private LocalDateTime createdAt = LocalDateTime.now();
}


/* A ChatSession represents a single overarching conversation. 
If you say "Start a new chat", you are creating a new ChatSession. */

/* Why the @ManyToOne with User? If 100 people are using your Gemini Clone, 
the database needs to know exactly whose chat this is. The @ManyToOne annotation creates a "Foreign Key" in the database. 
It basically says: "Many ChatSessions can belong to One User." When someone logs in, we will use this link to fetch only their chats, 
ensuring they don't see another person's private conversations. */