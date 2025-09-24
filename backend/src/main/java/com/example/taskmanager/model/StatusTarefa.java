package com.example.taskmanager.model;

/**
 * Enum que representa os possíveis status de uma Tarefa.
 */
public enum StatusTarefa {
    PENDENTE,     // Tarefa criada mas ainda não iniciada
    EM_ANDAMENTO, // Tarefa em progresso
    CONCLUIDA,    // Tarefa finalizada
    CANCELADA     // Tarefa cancelada
}
