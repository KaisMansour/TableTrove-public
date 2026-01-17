package com.ll.tabletrove_v3;
import android.app.Activity;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.concurrent.TimeUnit;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
public class HttpJsonService {
    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");
    private final OkHttpClient client;
    private final String baseUrl;

    public HttpJsonService() {
        this.baseUrl = "http://10.0.2.2:3000";

        // Configurer le client OkHttp
        this.client = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build();
    }

    // Interface pour les callbacks
    public interface ApiCallback<T> {
        void onSuccess(T result);
        void onFailure(String errorMessage);
    }

    // Méthode pour l'inscription
    public void registerUser(
            final Activity activity,
            final String prenom,
            final String nom,
            final String courriel,
            final String phone,
            final String ddn,
            final String mdp,
            final ApiCallback<String> callback) {

        (new Thread() {
            @Override
            public void run() {
                try {
                    // Créer le corps JSON
                    JSONObject obj = new JSONObject();
                    obj.put("prenom", prenom);
                    obj.put("nom", nom);
                    obj.put("email", courriel);
                    obj.put("telephone", phone);
                    obj.put("date_naissance", ddn);
                    obj.put("mot_de_passe", mdp);

                    // Créer la requête
                    Request request = new Request.Builder()
                            .url(baseUrl + "/api/utilisateurs/register")
                            .post(RequestBody.create(obj.toString(), JSON))
                            .build();

                    // Envoyer la requête
                    Response response = client.newCall(request).execute();
                    final String responseBody = response.body() != null ?
                            response.body().string() : null;

                    // Processeur du résultat
                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            try {
                                if (response.isSuccessful() && responseBody != null) {
                                    JSONObject jsonResponse = new JSONObject(responseBody);
                                    String message = jsonResponse.getString("message");
                                    callback.onSuccess(message);
                                } else {
                                    String eMessage = responseBody != null ?
                                            responseBody : "Une erreur est survenue";
                                    callback.onFailure(eMessage);
                                }
                            } catch (JSONException e) {
                                callback.onFailure("Erreur de JSON : " + e.getMessage());
                            }
                        }
                    });
                } catch (final Exception e) {
                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            callback.onFailure(e.getMessage());
                        }
                    });
                }
            }
        }).start();
    }

    // Méthode de connexion d'usger
    public void loginUser(
            final Activity activity,
            final String email,
            final String password,
            final ApiCallback<LoginResult> callback) {

        (new Thread() {
            @Override
            public void run() {
                try {
                    // Créer le corps JSON
                    JSONObject obj = new JSONObject();
                    obj.put("email", email);
                    obj.put("mot_de_passe", password);

                    // Créer la requête
                    Request request = new Request.Builder()
                            .url(baseUrl + "/api/utilisateurs/login")
                            .post(RequestBody.create(obj.toString(), JSON))
                            .build();

                    // Envoyer la requête
                    Response response = client.newCall(request).execute();
                    final String responseBody = response.body() != null ?
                            response.body().string() : null;

                    // Processeur du résultat
                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            try {
                                if (response.isSuccessful() && responseBody != null) {
                                    JSONObject obj = new JSONObject(responseBody);
                                    String token = obj.getString("token");
                                    JSONObject userObj = obj.getJSONObject("user");
                                    String userId = userObj.getString("id");
                                    LoginResult result = new LoginResult(token, userId);
                                    callback.onSuccess(result);
                                } else {
                                    String eMessage = responseBody != null ?
                                            responseBody : "Une erreur est survenue";
                                    callback.onFailure(eMessage);
                                }
                            } catch (JSONException e) {
                                callback.onFailure("Erreur de JSON : " + e.getMessage());
                            }
                        }
                    });
                } catch (final Exception e) {
                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            callback.onFailure(e.getMessage());
                        }
                    });
                }
            }
        }).start();
    }

    // Classe du résultat de connexion
    public static class LoginResult {
        private final String token;
        private final String userId;

        public LoginResult(String token, String userId) {
            this.token = token;
            this.userId = userId;
        }

        public String getToken() {
            return token;
        }

        public String getUserId() {
            return userId;
        }
    }

}
