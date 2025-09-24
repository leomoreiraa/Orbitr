package com.example.taskmanager.config;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class RequestLoggingInterceptor implements HandlerInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(RequestLoggingInterceptor.class);

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        logger.trace("REQUISIÇÃO HTTP - Método: {}, URL: {}, URI: {}, Content-Type: {}, Origin: {}",
                request.getMethod(), request.getRequestURL().toString(), request.getRequestURI(), request.getContentType(), request.getHeader("Origin"));
        return true;
    }
}