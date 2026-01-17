package com.ll.tabletrove_v3;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class RestaurantDetailActivity extends AppCompatActivity {

    private TextView tvRestaurantName, tvRestaurantAddress, tvRestaurantPhone, tvRestaurantDescription, tvCuisineType;
    private Button btnMakeReservation, btnBack;
    private String id_restaurant;
    private static final String TAG = "RestaurantDetailActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_restaurant_detail);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Initialize views
        tvRestaurantName = findViewById(R.id.tvRestaurantName);
        tvRestaurantAddress = findViewById(R.id.tvRestaurantAddress);
        tvRestaurantPhone = findViewById(R.id.tvRestaurantPhone);
        tvRestaurantDescription = findViewById(R.id.tvRestaurantDescription);
        tvCuisineType = findViewById(R.id.tvCuisineType);
        btnMakeReservation = findViewById(R.id.btnMakeReservation);
        btnBack = findViewById(R.id.btnBackRestaurantDetail);

        // Get restaurant ID from intent
        id_restaurant = getIntent().getStringExtra("restaurant_id");
        if (id_restaurant == null || id_restaurant.isEmpty()) {
            Toast.makeText(this, "Erreur: Identifiant de restaurant manquant", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        // Set up button listeners
        btnBack.setOnClickListener(v -> finish());

        btnMakeReservation.setOnClickListener(v -> {
            Intent iReservation = new Intent(RestaurantDetailActivity.this, ReservationActivity.class);
            iReservation.putExtra("restaurant_id", id_restaurant);
            iReservation.putExtra("restaurant_name", tvRestaurantName.getText().toString());
            startActivity(iReservation);
        });

        // Load restaurant details
        loadRestaurantDetails(id_restaurant);
    }

    private void loadRestaurantDetails(String id_restaurant) {
        // In a real application, this would fetch data from the API
        // For now, we'll simulate loading data

        // This is placeholder data
        String restaurantName = "Restaurant " + id_restaurant;
        String address = "123 Main Street, City";
        String phone = "(555) 123-4567";
        String description = "Un restaurant magnifique avec une ambiance chaleureuse et une cuisine exceptionnelle.";
        String cuisineType = "Française";

        // Update UI with restaurant details
        tvRestaurantName.setText(restaurantName);
        tvRestaurantAddress.setText(address);
        tvRestaurantPhone.setText(phone);
        tvRestaurantDescription.setText(description);
        tvCuisineType.setText("Cuisine: " + cuisineType);
    }
}