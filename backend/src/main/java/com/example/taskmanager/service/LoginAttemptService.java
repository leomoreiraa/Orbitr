package com.example.taskmanager.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginAttemptService {
    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();

    private record Attempt(int count, Instant lastAttempt) {}

    private final int MAX_ATTEMPTS = 5;
    private final long LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

    public void loginFailed(String key) {
        attempts.compute(key, (k, old) -> {
            if (old == null) return new Attempt(1, Instant.now());
            return new Attempt(old.count + 1, Instant.now());
        });
    }

    public void loginSucceeded(String key) {
        attempts.remove(key);
    }

    public boolean isBlocked(String key) {
        Attempt a = attempts.get(key);
        if (a == null) return false;
        if (a.count >= MAX_ATTEMPTS) {
            long since = Instant.now().toEpochMilli() - a.lastAttempt.toEpochMilli();
            if (since < LOCK_TIME_MS) return true;
            // unlock after lock time
            attempts.remove(key);
            return false;
        }
        return false;
    }
}
