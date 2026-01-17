package com.tabletrove.app.model;

public class Restaurant {
    private String id;
    private String name;
    private String address;
    private String cuisine;
    private float rating;
    private String imageUrl;
    private boolean availability;

    public Restaurant(String id, String name, String address, String cuisine, float rating, String imageUrl, boolean availability) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.cuisine = cuisine;
        this.rating = rating;
        this.imageUrl = imageUrl;
        this.availability = availability;
    }

    // Getters
    public String getId() { return id; }
    public String getName() { return name; }
    public String getAddress() { return address; }
    public String getCuisine() { return cuisine; }
    public float getRating() { return rating; }
    public String getImageUrl() { return imageUrl; }
    public boolean isAvailable() { return availability; }

    // Setters
    public void setId(String id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setAddress(String address) { this.address = address; }
    public void setCuisine(String cuisine) { this.cuisine = cuisine; }
    public void setRating(float rating) { this.rating = rating; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setAvailability(boolean availability) { this.availability = availability; }
}