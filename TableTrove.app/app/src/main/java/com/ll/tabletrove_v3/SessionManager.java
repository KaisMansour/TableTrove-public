package com.ll.tabletrove_v3;

import android.content.Context;
import android.content.SharedPreferences;

public class SessionManager {
    private static final String PREF_NAME = "TableTrovePrefs";
    private static final String KEY_TOKEN = "jwt_token";
    private static final String KEY_USER_ID = "user_id";
    private static final String KEY_EMAIL = "email";
    private static final String KEY_IS_LOGGED_IN = "is_logged_in";

    private SharedPreferences sharedPreferences;
    private SharedPreferences.Editor editor;
    private Context context;

    public SessionManager(Context context) {
        this.context = context;
        sharedPreferences = this.context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        editor = sharedPreferences.edit();
    }

    // Sauvegarder l'authorisation de la session
    public void createLoginSession(String token, String userId, String email) {
        editor.putString(KEY_TOKEN, token);
        editor.putString(KEY_USER_ID, userId);
        editor.putString(KEY_EMAIL, email);
        editor.putBoolean(KEY_IS_LOGGED_IN, true);

        // Commit les changements de facon synchrone
        editor.commit();
    }
    // Sauvegarder le courriel
    public void saveEmail(String email) {
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putString(KEY_EMAIL, email);
        editor.apply(); // Sauvegarde asynchrone
    }

    // Recuperer le token de l'usager
    public String getToken() {
        return sharedPreferences.getString(KEY_TOKEN, null);
    }

    // Recuperer le ID de l'usager
    public String getUserId() {
        return sharedPreferences.getString(KEY_USER_ID, null);
    }

    // Recuperer le courriel de l'usager
    public String getUserEmail() {
        return sharedPreferences.getString(KEY_EMAIL, null);
    }

    // Verifier l'etat de connexion de l'usager
    public boolean estConnecte() {
        return sharedPreferences.getBoolean(KEY_IS_LOGGED_IN, false);
    }

    // Effacer les donnees de la session de l'usager (logout)
    public void seDeconnecter() {
        editor.clear();
        editor.commit();
    }
}
