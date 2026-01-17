package com.ll.tabletrove_v3;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.AdapterView;
import android.widget.Button;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class MainActivity extends AppCompatActivity {

    Button btnSeConnecter, btnSettings, btnNotifs, btnRechercher;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        try {
            // Initialiser les vues
            btnNotifs = findViewById(R.id.btnNotifs);
            btnSeConnecter = findViewById(R.id.btnSeConnecter);
            btnSettings = findViewById(R.id.btnSettings);
            btnRechercher = findViewById(R.id.btnRechercher);

            // Verifier si les vues sont disponibles
            if (btnSeConnecter == null || btnSettings == null || btnNotifs == null || btnRechercher == null) {
                Log.e("MainActivity", "Un ou plus de boutons ne sont pas disponibles");
                return;
            }

            btnSeConnecter.setOnClickListener(v -> {
                try {
                    Intent iSeConnecter = new Intent(v.getContext(), LoginActivity.class);
                    startActivity(iSeConnecter);
                } catch (Exception e) {
                    Log.e("MainActivity", "Erreur en commencant MainActivity : " + e.getMessage());
                }
            });

            btnSettings.setOnClickListener(v -> {
                try {
                    Intent iProfile = new Intent(v.getContext(), ProfileActivity.class);
                    startActivity(iProfile);
                } catch (Exception e) {
                    Log.e("MainActivity", "Erreur en commencant ProfileActivity: " + e.getMessage());
                }
            });

            btnNotifs.setOnClickListener(v -> {
                try {
                    // Ajouter fonction. ex.: dropdown list des notifications des reservations
                    //                   ou : ouvrir activite ReservationActivity
                    // Pour le moment, verifier qu'il peut etre clique
                    Log.d("MainActivity", "Bouton Notifs clique");
                } catch (Exception e) {
                    Log.e("MainActivity", "Erreur Notifs: " + e.getMessage());
                }
            });
            btnRechercher.setOnClickListener(v -> {
                try {
                    SharedPreferences prefs = getSharedPreferences("TableTrovePrefs", MODE_PRIVATE);
                    String token = prefs.getString("jwt_token", null);

                    // Verifier si le user est connecte
                    if (token != null && !token.isEmpty()) {
                        Intent iRechercheResto = new Intent(v.getContext(), RechercheRestoActivity.class);
                        startActivity(iRechercheResto);
                        // S'il ne l'est pas, on l'envoie vers l'activite Login
                    } else {
                        Intent iSeConnecter = new Intent(v.getContext(), LoginActivity.class);
                        startActivity(iSeConnecter);
                    }
                } catch (Exception e) {
                    Log.e("MainActivity", "Erreur du handler btnRecherche: " + e.getMessage());
                }
            });
        } catch (Exception e) {
            Log.e("MainActivity", "Erreur d'initialisation de MainActivity: " + e.getMessage());
        }
    }
}