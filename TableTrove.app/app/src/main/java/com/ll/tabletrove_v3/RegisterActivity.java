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

public class RegisterActivity extends AppCompatActivity {

    EditText etPrenom, etNom, etEmail, etTelephone, etMdp, etDdn, etMdp2;
    TextView tvPrenom, tvNom, tvEmail, tvPhone, tvMdp, tvDdn, tvMdp2;

    Button btnSubmit, btnRetour;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_register);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Initialiser les vues
        etPrenom = findViewById(R.id.etPrenom);
        etNom = findViewById(R.id.etNom);
        etEmail = findViewById(R.id.etRegisterEmail);
        etTelephone = findViewById(R.id.etTelephone);
        etMdp = findViewById(R.id.etRegisterMdp);
        etDdn = findViewById(R.id.etDateNaiss);
        etMdp2 = findViewById(R.id.etConfirmMdp);
        // Messages d'erreur
        tvPrenom = findViewById(R.id.tvErreurPrenomReg);
        tvNom = findViewById(R.id.tvErreurNomReg);
        tvDdn = findViewById(R.id.tvErreurDdnReg);
        tvPhone = findViewById(R.id.tvErreurPhoneReg);
        tvEmail = findViewById(R.id.tvErreurEmailReg);
        tvMdp = findViewById(R.id.tvErreurMdpReg);
        tvMdp2 = findViewById(R.id.tvErreurMdp2Reg);
        // Boutons
        btnSubmit = findViewById(R.id.btnSubmit);
        btnRetour = findViewById(R.id.btnRetourReg);

        btnRetour.setOnClickListener(v -> {
            Intent iLogin = new Intent(RegisterActivity.this, LoginActivity.class);
            startActivity(iLogin);
        });

        btnSubmit.setOnClickListener(v -> {
            // Valider les entrees
            if (validerEntrees()) {
                // Transformer les valeurs de EditText en String pour passer dans la fct de ApiHelper
                String prenom = etPrenom.getText().toString().trim();
                String nom = etNom.getText().toString().trim();
                String courriel = etEmail.getText().toString().trim();
                String ddn = etDdn.getText().toString().trim();
                String mdp = etMdp.getText().toString().trim();
                String telephone = etTelephone.getText().toString().trim();

                // Utiliser le ApiHelper pour inscrire le client
                HttpJsonService apiHelper = new HttpJsonService();
                apiHelper.registerUser(this, prenom, nom, courriel, telephone, ddn, mdp, new HttpJsonService.ApiCallback<String>() {
                    @Override
                    public void onSuccess(String message) {
                        // Afficher un message de succes
                        Toast.makeText(RegisterActivity.this, message, Toast.LENGTH_SHORT).show();

                        // Initialiser SessionManager
                        //SessionManager sessionManager = new SessionManager(this);
                        // Sauvegarder le courriel
                        //sessionManager.saveEmail(courriel);

                        // Rediriger vers l'activite LoginActivity
                        Intent iLoginActivity = new Intent(RegisterActivity.this, LoginActivity.class);
                        iLoginActivity.putExtra("email", courriel); // On envoie le courriel rempli
                        startActivity(iLoginActivity);
                        finish();
                    }

                    @Override
                    public void onFailure(String eMessage) {
                        Toast.makeText(RegisterActivity.this, eMessage, Toast.LENGTH_SHORT).show();
                    }
                });
            }
        });

    }
    private boolean validerEntrees() {
        boolean isValid = true;

        // Transformer les valeurs de EditText en String pour effectuer la validation
        String prenom = etPrenom.getText().toString().trim();
        String nom = etNom.getText().toString().trim();
        String courriel = etEmail.getText().toString().trim();
        String ddn = etDdn.getText().toString().trim();
        String mdp = etMdp.getText().toString().trim();
        String telephone = etTelephone.getText().toString().trim();
        String confirmMdp = etMdp2.getText().toString().trim();

        // Valider le prénom
        if (prenom.isEmpty()) {
            tvPrenom.setText("Prénom requis");
            isValid = false;
        }

        // Valider le nom de famille
        if (nom.isEmpty()) {
            tvNom.setText("Nom requis");
            isValid = false;
        }

        // Valider le courriel
        if (courriel.isEmpty() || !android.util.Patterns.EMAIL_ADDRESS.matcher(courriel).matches()) {
            tvEmail.setText("Entrer un courriel valide");
            isValid = false;
        }

        // Valider le numéro de téléphone
        if (telephone.isEmpty()) {
            tvPhone.setText("Numéro de téléphone requis");
            isValid = false;
        }

        // Valider la date de naissance
        if (ddn.isEmpty()) {
            tvDdn.setText("Date de naissance requise");
            isValid = false;
        }

        // Valider le mot de passe
        if (mdp.isEmpty() || mdp.length() < 8) {
            tvMdp.setText("Le mot de passe doit contenir au moins 8 caractères.");
            isValid = false;
        }

        // Vérifier que les mots de passe concordent
        if (!mdp.equals(confirmMdp)) {
            tvMdp2.setText("Les mots de passe ne correspondent pas.");
            isValid = false;
        }

        return isValid;
    }
}