package com.tabletrove.app;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.tabletrove.app.ui.dashboard.DashboardFragment;
import com.tabletrove.app.ui.profile.ProfileFragment;
import com.tabletrove.app.ui.search.SearchFragment;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        BottomNavigationView bottomNavigationView = findViewById(R.id.bottom_nav_view);

        // Par défaut, afficher le fragment de recherche
        if (savedInstanceState == null) {
            getSupportFragmentManager().beginTransaction()
                    .replace(R.id.nav_host_fragment, new SearchFragment())
                    .commit();
        }

        // Configurer la navigation
        bottomNavigationView.setOnItemSelectedListener(item -> {
            Fragment selectedFragment = null;

            int itemId = item.getItemId();
            if (itemId == R.id.searchFragment) {
                selectedFragment = new SearchFragment();
            } else if (itemId == R.id.dashboardFragment) {
                selectedFragment = new DashboardFragment();
            } else if (itemId == R.id.profileFragment) {
                selectedFragment = new ProfileFragment();
            }

            if (selectedFragment != null) {
                getSupportFragmentManager().beginTransaction()
                        .replace(R.id.nav_host_fragment, selectedFragment)
                        .commit();
                return true;
            }

            return false;
        });
    }
}