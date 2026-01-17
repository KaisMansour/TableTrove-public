package com.ll.tabletrove_v3;

import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.os.Bundle;
import android.util.Log;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

public class ReservationActivity extends AppCompatActivity {

    private static final String TAG = "ReservationActivity";

    private TextView tvRestaurantNameReservation;
    private Button btnSelectDate, btnSelectTime, btnSubmitReservation, btnCancelReservation;
    private EditText etSpecialRequests;
    private Spinner spinnerPersonCount;

    private String id_restaurant, restaurantName;
    private Calendar calendar;
    private SimpleDateFormat dateFormatter, timeFormatter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_reservation);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Initialize views
        tvRestaurantNameReservation = findViewById(R.id.tvRestaurantNameReservation);
        btnSelectDate = findViewById(R.id.btnSelectDate);
        btnSelectTime = findViewById(R.id.btnSelectTime);
        btnSubmitReservation = findViewById(R.id.btnSubmitReservation);
        btnCancelReservation = findViewById(R.id.btnCancelReservation);
        etSpecialRequests = findViewById(R.id.etSpecialRequests);
        spinnerPersonCount = findViewById(R.id.spinnerPersonCount);

        // Get data from intent
        id_restaurant = getIntent().getStringExtra("restaurant_id");
        restaurantName = getIntent().getStringExtra("restaurant_name");

        // Set restaurant name
        tvRestaurantNameReservation.setText(restaurantName);

        // Initialize date and time formatters
        calendar = Calendar.getInstance();
        dateFormatter = new SimpleDateFormat("dd/MM/yyyy", Locale.getDefault());
        timeFormatter = new SimpleDateFormat("HH:mm", Locale.getDefault());

        // Set default date and time on buttons
        updateDateButtonText();
        updateTimeButtonText();

        // Setup spinner with number of persons
        setupPersonCountSpinner();

        // Setup button click listeners
        setupButtonListeners();
    }

    private void setupPersonCountSpinner() {
        Integer[] personCounts = new Integer[]{1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
        ArrayAdapter<Integer> adapter = new ArrayAdapter<>(this,
                android.R.layout.simple_spinner_item, personCounts);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerPersonCount.setAdapter(adapter);

        // Set default selection to 2 persons
        spinnerPersonCount.setSelection(1);
    }

    private void setupButtonListeners() {
        // Date picker button
        btnSelectDate.setOnClickListener(v -> {
            DatePickerDialog datePickerDialog = new DatePickerDialog(
                    ReservationActivity.this,
                    (view, year, month, dayOfMonth) -> {
                        calendar.set(Calendar.YEAR, year);
                        calendar.set(Calendar.MONTH, month);
                        calendar.set(Calendar.DAY_OF_MONTH, dayOfMonth);
                        updateDateButtonText();
                    },
                    calendar.get(Calendar.YEAR),
                    calendar.get(Calendar.MONTH),
                    calendar.get(Calendar.DAY_OF_MONTH)
            );

            // Set minimum date to today
            datePickerDialog.getDatePicker().setMinDate(System.currentTimeMillis() - 1000);

            datePickerDialog.show();
        });

        // Time picker button
        btnSelectTime.setOnClickListener(v -> {
            TimePickerDialog timePickerDialog = new TimePickerDialog(
                    ReservationActivity.this,
                    (view, hourOfDay, minute) -> {
                        calendar.set(Calendar.HOUR_OF_DAY, hourOfDay);
                        calendar.set(Calendar.MINUTE, minute);
                        updateTimeButtonText();
                    },
                    calendar.get(Calendar.HOUR_OF_DAY),
                    calendar.get(Calendar.MINUTE),
                    true
            );
            timePickerDialog.show();
        });

        // Submit reservation button
        btnSubmitReservation.setOnClickListener(v -> submitReservation());

        // Cancel button
        btnCancelReservation.setOnClickListener(v -> finish());
    }

    private void updateDateButtonText() {
        btnSelectDate.setText(dateFormatter.format(calendar.getTime()));
    }

    private void updateTimeButtonText() {
        btnSelectTime.setText(timeFormatter.format(calendar.getTime()));
    }

    private void submitReservation() {
        // Get reservation details
        String date = dateFormatter.format(calendar.getTime());
        String time = timeFormatter.format(calendar.getTime());
        int numberOfPersons = (Integer) spinnerPersonCount.getSelectedItem();
        String specialRequests = etSpecialRequests.getText().toString().trim();

        // Validate that the selected time is in the future
        Calendar now = Calendar.getInstance();
        if (calendar.before(now)) {
            Toast.makeText(this, "Veuillez sélectionner une date et une heure dans le futur",
                    Toast.LENGTH_SHORT).show();
            return;
        }

        // In a real application, this would send the data to the API
        // For demonstration, we'll just show a success message

        String message = "Réservation pour " + numberOfPersons + " personne(s) le " +
                date + " à " + time + " confirmée!";

        Toast.makeText(this, message, Toast.LENGTH_LONG).show();

        // Close the activity
        finish();
    }
}