package com.example.taskmanager.dto;

import com.example.taskmanager.model.Board;
import java.util.List;

public class BoardsSeparatedResponse {
    private List<Board> own;
    private List<Board> shared;
    
    public BoardsSeparatedResponse(List<Board> own, List<Board> shared) {
        this.own = own;
        this.shared = shared;
    }
    
    public List<Board> getOwn() {
        return own;
    }
    
    public void setOwn(List<Board> own) {
        this.own = own;
    }
    
    public List<Board> getShared() {
        return shared;
    }
    
    public void setShared(List<Board> shared) {
        this.shared = shared;
    }
}