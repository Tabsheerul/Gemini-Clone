package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String role; // "user" or "model"

    @Column(columnDefinition = "TEXT", nullable = false)
    private String text;

    private LocalDateTime timestamp = LocalDateTime.now();

    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_session_id")
    private ChatSession chatSession;
}


/* A Message represents a single text bubble inside of a specific ChatSession. 
Every time you ask a question and the AI replies, you are creating two messages (one for you, one for the AI). */

/* Why the @ManyToOne with ChatSession? Imagine your database has 10,000 total messages across all users. 
When a user clicks on "React Help" in the sidebar, we only want to fetch the messages for that specific thread. 
The @ManyToOne links this specific text bubble back to the ChatSession it belongs to.*/
