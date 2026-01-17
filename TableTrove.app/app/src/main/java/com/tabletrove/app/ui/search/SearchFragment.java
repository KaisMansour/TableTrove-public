package com.tabletrove.app.ui.search;

import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.Button;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.tabletrove.app.R;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

public class SearchFragment extends Fragment {

    private Button dateTimeButton;
    private Button searchButton;
    private Calendar selectedDateTime = Calendar.getInstance();
    private SimpleDateFormat dateTimeFormat = new SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault());

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_search, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // Initialize views
        dateTimeButton = view.findViewById(R.id.dateTimeButton);
        searchButton = view.findViewById(R.id.searchButton);
        AutoCompleteTextView cuisineAutoComplete = view.findViewById(R.id.cuisineAutoCompleteTextView);

        // Setup cuisine dropdown
        String[] cuisines = {"Française", "Italienne", "Asiatique", "Américaine", "Mexicaine", "Indienne"};
        ArrayAdapter<String> adapter = new ArrayAdapter<>(
                requireContext(),
                android.R.layout.simple_dropdown_item_1line,
                cuisines
        );
        cuisineAutoComplete.setAdapter(adapter);

        // Setup date-time button
        dateTimeButton.setText(dateTimeFormat.format(selectedDateTime.getTime()));
        dateTimeButton.setOnClickListener(v -> showDateTimePicker());

        // Setup search button
        searchButton.setOnClickListener(v -> {
            Toast.makeText(requireContext(), "Recherche de restaurants...", Toast.LENGTH_SHORT).show();
            // Implement restaurant search functionality here
        });
    }

    private void showDateTimePicker() {
        // Show date picker first
        DatePickerDialog datePickerDialog = new DatePickerDialog(
                requireContext(),
                (view, year, month, dayOfMonth) -> {
                    selectedDateTime.set(Calendar.YEAR, year);
                    selectedDateTime.set(Calendar.MONTH, month);
                    selectedDateTime.set(Calendar.DAY_OF_MONTH, dayOfMonth);

                    // Show time picker after date is selected
                    TimePickerDialog timePickerDialog = new TimePickerDialog(
                            requireContext(),
                            (view1, hourOfDay, minute) -> {
                                selectedDateTime.set(Calendar.HOUR_OF_DAY, hourOfDay);
                                selectedDateTime.set(Calendar.MINUTE, minute);
                                dateTimeButton.setText(dateTimeFormat.format(selectedDateTime.getTime()));
                            },
                            selectedDateTime.get(Calendar.HOUR_OF_DAY),
                            selectedDateTime.get(Calendar.MINUTE),
                            true
                    );
                    timePickerDialog.show();
                },
                selectedDateTime.get(Calendar.YEAR),
                selectedDateTime.get(Calendar.MONTH),
                selectedDateTime.get(Calendar.DAY_OF_MONTH)
        );
        datePickerDialog.getDatePicker().setMinDate(System.currentTimeMillis() - 1000);
        datePickerDialog.show();
    }
}