package com.ll.tabletrove_v3;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.Spinner;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import java.util.ArrayList;
import java.util.List;

public class RechercheRestoActivity extends AppCompatActivity {

    private EditText etSearchRestaurant;
    private Spinner spinnerCuisineType;
    private ListView listViewRestaurants;
    private Button btnRetourRecherche;

    private List<Restaurant> restaurants;
    private ArrayAdapter<Restaurant> adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_recherche_resto);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Initialize views
        etSearchRestaurant = findViewById(R.id.etSearchRestaurant);
        spinnerCuisineType = findViewById(R.id.spinnerCuisineType);
        listViewRestaurants = findViewById(R.id.listViewRestaurants);
        btnRetourRecherche = findViewById(R.id.btnRetourRecherche);

        // Setup return button
        btnRetourRecherche.setOnClickListener(v -> finish());

        // Initialize restaurant list with sample data
        setupSampleRestaurants();

        // Setup cuisine type spinner
        setupCuisineTypeSpinner();

        // Setup restaurant list adapter
        setupRestaurantListAdapter();

        // Setup search functionality
        setupSearchFunctionality();
    }

    private void setupSampleRestaurants() {
        restaurants = new ArrayList<>();

        // Add sample restaurants
        restaurants.add(new Restaurant("1", "Le Bon Goût", "Française", "123 Rue de Paris", "★★★★☆"));
        restaurants.add(new Restaurant("2", "Pasta Bella", "Italienne", "45 Avenue des Champs", "★★★★★"));
        restaurants.add(new Restaurant("3", "Sushi Master", "Japonaise", "78 Rue du Commerce", "★★★☆☆"));
        restaurants.add(new Restaurant("4", "El Toro", "Espagnole", "10 Boulevard Saint-Michel", "★★★★☆"));
        restaurants.add(new Restaurant("5", "Taj Mahal", "Indienne", "55 Rue Saint-Denis", "★★★★☆"));
        restaurants.add(new Restaurant("6", "Pho 99", "Vietnamienne", "32 Rue de la Paix", "★★★★★"));
        restaurants.add(new Restaurant("7", "Le Petit Bistro", "Française", "17 Place de la République", "★★★☆☆"));
        restaurants.add(new Restaurant("8", "China Town", "Chinoise", "8 Rue de Belleville", "★★★★☆"));
    }

    private void setupCuisineTypeSpinner() {
        List<String> cuisineTypes = new ArrayList<>();
        cuisineTypes.add("Toutes les cuisines");
        cuisineTypes.add("Française");
        cuisineTypes.add("Italienne");
        cuisineTypes.add("Japonaise");
        cuisineTypes.add("Espagnole");
        cuisineTypes.add("Indienne");
        cuisineTypes.add("Vietnamienne");
        cuisineTypes.add("Chinoise");

        ArrayAdapter<String> cuisineAdapter = new ArrayAdapter<>(
                this, android.R.layout.simple_spinner_item, cuisineTypes);
        cuisineAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerCuisineType.setAdapter(cuisineAdapter);

        spinnerCuisineType.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                filterRestaurants();
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {
                // Do nothing
            }
        });
    }

    private void setupRestaurantListAdapter() {
        adapter = new ArrayAdapter<>(this, android.R.layout.simple_list_item_1, restaurants);
        listViewRestaurants.setAdapter(adapter);

        listViewRestaurants.setOnItemClickListener((parent, view, position, id) -> {
            Restaurant selectedRestaurant = adapter.getItem(position);
            if (selectedRestaurant != null) {
                Intent intent = new Intent(RechercheRestoActivity.this, RestaurantDetailActivity.class);
                intent.putExtra("restaurant_id", selectedRestaurant.getId());
                startActivity(intent);
            }
        });
    }

    private void setupSearchFunctionality() {
        etSearchRestaurant.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                // Not used
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                // Filter restaurants when text changes
                filterRestaurants();
            }

            @Override
            public void afterTextChanged(Editable s) {
                // Not used
            }
        });
    }

    private void filterRestaurants() {
        String searchText = etSearchRestaurant.getText().toString().toLowerCase().trim();
        String selectedCuisine = spinnerCuisineType.getSelectedItem().toString();

        List<Restaurant> filteredList = new ArrayList<>();

        for (Restaurant restaurant : restaurants) {
            boolean matchesCuisine = selectedCuisine.equals("Toutes les cuisines") ||
                    restaurant.getCuisineType().equals(selectedCuisine);

            boolean matchesSearch = restaurant.getName().toLowerCase().contains(searchText) ||
                    restaurant.getCuisineType().toLowerCase().contains(searchText) ||
                    restaurant.getAddress().toLowerCase().contains(searchText);

            if (matchesCuisine && matchesSearch) {
                filteredList.add(restaurant);
            }
        }

        adapter.clear();
        adapter.addAll(filteredList);
        adapter.notifyDataSetChanged();
    }

    // Simple Restaurant class to hold restaurant data
    private static class Restaurant {
        private final String id;
        private final String name;
        private final String cuisineType;
        private final String address;
        private final String rating;

        public Restaurant(String id, String name, String cuisineType, String address, String rating) {
            this.id = id;
            this.name = name;
            this.cuisineType = cuisineType;
            this.address = address;
            this.rating = rating;
        }

        public String getId() {
            return id;
        }

        public String getName() {
            return name;
        }

        public String getCuisineType() {
            return cuisineType;
        }

        public String getAddress() {
            return address;
        }

        public String getRating() {
            return rating;
        }

        @Override
        public String toString() {
            return name + " (" + cuisineType + ")\n" + address + " " + rating;
        }
    }
}