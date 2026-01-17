package com.ll.tabletrove_v3;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class LoginActivity extends AppCompatActivity {

    EditText etCourriel, etMdp;
    Button btnLogin, btnSeInscrire, btnRetour;
    TextView tvErreurEmail, tvErreurMdp;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_login);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Initialiser les vues
        etCourriel = findViewById(R.id.etLoginEmail);
        etMdp = findViewById(R.id.etLoginMdp);
        btnLogin = findViewById(R.id.btnLogin);
        btnSeInscrire = findViewById(R.id.btnSeInscrire);
        btnRetour = findViewById(R.id.btnRetourLogin);
        tvErreurEmail = findViewById(R.id.tvErreurEmailLogin);
        tvErreurMdp = findViewById(R.id.tvErreurMdpLogin);

        // Recuperer le courriel de RegisterActivity s'il existe
        String email = getIntent().getStringExtra("email");
        // Verifier s'il existe dans les SharedPreferences
        if (email == null || email.isEmpty()) {
            SessionManager sessionManager = new SessionManager(this);
            email = sessionManager.getUserEmail();
        }
        // Automatiquement remplir le courriel s'il existe deja
        if (email != null && !email.isEmpty()) {
            etCourriel.setText(email);
        }

        // Bouton d'inscription
        btnSeInscrire.setOnClickListener(v -> {
            Intent iRegister = new Intent(LoginActivity.this, RegisterActivity.class);
            startActivity(iRegister);
        });

        // Bouton retour
        btnRetour.setOnClickListener(v -> {
            Intent iMain = new Intent(LoginActivity.this,MainActivity.class);
            startActivity(iMain);
        });

        // Bouton de connexion
        btnLogin.setOnClickListener(v -> {
            // Transformer en String pour utiliser le HttpJsonService
            String emailEntree = etCourriel.getText().toString().trim();
            String mdp = etMdp.getText().toString().trim();

            // Valider les entrees
            if (emailEntree.isEmpty()) {
                tvErreurEmail.setText("Courriel requis");
            }
            if (mdp.isEmpty()) {
                tvErreurMdp.setText("Mot de passe requis");
            }

            // Initialiser SessionManager
            SessionManager sessionManager = new SessionManager(this);

            // Utiliser HttpJsonService pour effectuer la connexion de l'usager
            HttpJsonService apiHelper = new HttpJsonService();
            apiHelper.loginUser(
                    LoginActivity.this,
                    emailEntree,
                    mdp,
                    new HttpJsonService.ApiCallback<>() {
                        @Override
                        public void onSuccess(HttpJsonService.LoginResult result) {
                            // Afficher un message de succes
                            Toast.makeText(LoginActivity.this, "Connexion réussie", Toast.LENGTH_LONG).show();

                            // Sauvegarder les donnees dans SharedPreferences avec SessionManager
                            sessionManager.createLoginSession(
                                    result.getToken(),
                                    result.getUserId(),
                                    emailEntree
                            );

                            // Renvoyer vers l'activite Main
                            Intent iMain = new Intent(LoginActivity.this, MainActivity.class);
                            startActivity(iMain);
                            finish();
                        }

                        @Override
                        public void onFailure(String errorMessage) {

                            // Afficher le message d'erreur
                            Toast.makeText(LoginActivity.this, errorMessage, Toast.LENGTH_SHORT).show();
                        }
                    }
            );
        });




    }
}