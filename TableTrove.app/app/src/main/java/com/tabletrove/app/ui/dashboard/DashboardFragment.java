package com.tabletrove.app.ui.dashboard;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.android.material.tabs.TabLayout;
import com.tabletrove.app.R;

public class DashboardFragment extends Fragment {

    private TabLayout tabLayout;
    private RecyclerView reservationsRecyclerView;
    private TextView emptyTextView;
    private FloatingActionButton newReservationFab;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_dashboard, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // Initialize views
        tabLayout = view.findViewById(R.id.tabLayout);
        reservationsRecyclerView = view.findViewById(R.id.reservationsRecyclerView);
        emptyTextView = view.findViewById(R.id.emptyTextView);
        newReservationFab = view.findViewById(R.id.newReservationFab);

        // Setup tab selection listener
        tabLayout.addOnTabSelectedListener(new TabLayout.OnTabSelectedListener() {
            @Override
            public void onTabSelected(TabLayout.Tab tab) {
                // Update the reservations list based on the selected tab
                updateReservationsList(tab.getPosition());
            }

            @Override
            public void onTabUnselected(TabLayout.Tab tab) {
                // Not needed for this implementation
            }

            @Override
            public void onTabReselected(TabLayout.Tab tab) {
                // Not needed for this implementation
            }
        });

        // Setup FAB listener
        newReservationFab.setOnClickListener(v -> {
            // Navigate to search fragment or show reservation dialog
            // Implementation would depend on your navigation setup
        });

        // Initial load of reservations list
        updateReservationsList(0); // 0 = upcoming tab
    }

    private void updateReservationsList(int tabPosition) {
        // In a real app, this would fetch data from your database or API
        // For now, we'll just show the empty state

        // Show empty text view when there are no reservations
        emptyTextView.setVisibility(View.VISIBLE);
        reservationsRecyclerView.setVisibility(View.GONE);

        // Update empty text message based on tab
        switch (tabPosition) {
            case 0: // Upcoming
                emptyTextView.setText("Aucune réservation à venir");
                break;
            case 1: // Past
                emptyTextView.setText("Aucune réservation passée");
                break;
            case 2: // Cancelled
                emptyTextView.setText("Aucune réservation annulée");
                break;
        }
    }
}