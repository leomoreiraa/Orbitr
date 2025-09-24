package com.example.taskmanager.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.email")
public class EmailConfig {
    
    private String fromAddress = "Orbitr Task Manager <noreply@orbitr.com>";
    private String fromName = "Orbitr Task Manager";
    private String supportEmail = "suporte@orbitr.com";
    private String websiteUrl = "https://orbitr.com";
    private String appUrl = "http://localhost:4200";
    
    // Getters e Setters
    public String getFromAddress() {
        return fromAddress;
    }
    
    public void setFromAddress(String fromAddress) {
        this.fromAddress = fromAddress;
    }
    
    public String getFromName() {
        return fromName;
    }
    
    public void setFromName(String fromName) {
        this.fromName = fromName;
    }
    
    public String getSupportEmail() {
        return supportEmail;
    }
    
    public void setSupportEmail(String supportEmail) {
        this.supportEmail = supportEmail;
    }
    
    public String getWebsiteUrl() {
        return websiteUrl;
    }
    
    public void setWebsiteUrl(String websiteUrl) {
        this.websiteUrl = websiteUrl;
    }
    
    public String getAppUrl() {
        return appUrl;
    }
    
    public void setAppUrl(String appUrl) {
        this.appUrl = appUrl;
    }
}