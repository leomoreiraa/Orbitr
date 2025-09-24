package com.example.taskmanager;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Classe principal que inicializa a aplicação Orbitr.
 * Orbitr - Seu espaço de produtividade: transformando ideias em realidade.
 */
@SpringBootApplication
public class TaskManagerApplication {
    private static final Logger logger = LoggerFactory.getLogger(TaskManagerApplication.class);
    public static void main(String[] args) {
        logger.info("🚀 Iniciando Orbitr - Seu espaço de produtividade");
        SpringApplication.run(TaskManagerApplication.class, args);
        logger.info("✅ Orbitr está rodando!");
    }
}
