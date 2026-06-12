package com.example.demo.repository;

import com.example.demo.entity.ChatSession;
import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    List<ChatSession> findTop30ByUserOrderByCreatedAtDesc(User user);
}


/* What it does: By simply writing that method name, Spring Boot magically writes a complex SQL query for us.
Why we need it: When the user logs in and loads the webpage, 
we need to fill the left sidebar with their history. 
We call this method and say "Give me a List of all ChatSessions belonging to this User, 
and Order them by the time they were created Descending (newest chats at the top)." */