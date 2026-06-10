package com.example.demo.repository;

import com.example.demo.entity.Message;
import com.example.demo.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByChatSessionOrderByTimestampAsc(ChatSession chatSession);
}


/* What it does: Fetches all messages for a specific conversation.
Why we need it: When the user clicks on a chat in the sidebar, 
we need to load the chat history in the center of the screen. 
We call this method and say "Give me a List of all Messages belonging to this specific ChatSession, 
and Order them by Timestamp Ascending (oldest at the top, newest at the bottom so it reads like a normal chat)." */