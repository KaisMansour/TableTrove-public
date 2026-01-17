package com.tabletrove.app.ui.profile;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.ImageView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.google.android.material.textfield.TextInputEditText;
import com.tabletrove.app.R;

public class ProfileFragment extends Fragment {

    private ImageView profileImageView;
    private Button changePhotoButton;
    private TextInputEditText firstNameEditText;
    private TextInputEditText lastNameEditText;
    private TextInputEditText emailEditText;
    private TextInputEditText phoneEditText;
    private CheckBox vegetarianCheckBox;
    private CheckBox veganCheckBox;
    private CheckBox glutenFreeCheckBox;
    private CheckBox lactoseFreeCheckBox;
    private Button saveButton;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_profile, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // Initialize views
        profileImageView = view.findViewById(R.id.profileImageView);
        changePhotoButton = view.findViewById(R.id.changePhotoButton);
        firstNameEditText = view.findViewById(R.id.firstNameEditText);
        lastNameEditText = view.findViewById(R.id.lastNameEditText);
        emailEditText = view.findViewById(R.id.emailEditText);
        phoneEditText = view.findViewById(R.id.phoneEditText);
        vegetarianCheckBox = view.findViewById(R.id.vegetarianCheckBox);
        veganCheckBox = view.findViewById(R.id.veganCheckBox);
        glutenFreeCheckBox = view.findViewById(R.id.glutenFreeCheckBox);
        lactoseFreeCheckBox = view.findViewById(R.id.lactoseFreeCheckBox);
        saveButton = view.findViewById(R.id.saveButton);

        // Setup change photo button
        changePhotoButton.setOnClickListener(v -> {
            // In a real app, you would implement image picking functionality
            Toast.makeText(requireContext(), "Fonctionnalité à implémenter", Toast.LENGTH_SHORT).show();
        });

        // Setup save button
        saveButton.setOnClickListener(v -> {
            if (validateInputs()) {
                saveProfile();
            }
        });

        // Load existing profile data if available
        loadProfileData();
    }

    private boolean validateInputs() {
        // Validate that required fields are filled
        if (firstNameEditText.getText().toString().trim().isEmpty()) {
            firstNameEditText.setError("Le prénom est requis");
            return false;
        }

        if (lastNameEditText.getText().toString().trim().isEmpty()) {
            lastNameEditText.setError("Le nom est requis");
            return false;
        }

        if (emailEditText.getText().toString().trim().isEmpty()) {
            emailEditText.setError("L'email est requis");
            return false;
        }

        // Basic email validation
        String email = emailEditText.getText().toString().trim();
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            emailEditText.setError("Email invalide");
            return false;
        }

        return true;
    }

    private void saveProfile() {
        // In a real app, you would save the profile to a database or a remote server
        // For now, just show a success message
        Toast.makeText(requireContext(), "Profil enregistré avec succès", Toast.LENGTH_SHORT).show();
    }

    private void loadProfileData() {
        // In a real app, you would load profile data from a database or a remote server
        // For now, just populate with sample data
        firstNameEditText.setText("Jean");
        lastNameEditText.setText("Dupont");
        emailEditText.setText("jean.dupont@example.com");
        phoneEditText.setText("0612345678");
    }
}