package com.example.taskmanager.model;

/**
 * Enum que representa as prioridades possíveis de uma tarefa.
 */
public enum PrioridadeTarefa {
    BAIXA("baixa"),
    NORMAL("normal"),
    ALTA("alta"),
    URGENTE("urgente");

    private final String valor;

    PrioridadeTarefa(String valor) {
        this.valor = valor;
    }

    public String getValor() {
        return valor;
    }

    @Override
    public String toString() {
        return valor;
    }
}