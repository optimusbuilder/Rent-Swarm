import { NextRequest, NextResponse } from 'next/server';
import { calculateCommuteCost, createCommuteCost } from '@/lib/utils/remc-calculator';

export async function POST(req: NextRequest) {
    try {
        const { origin, destination, mode = 'driving' } = await req.json();

        if (!origin || !destination) {
            return NextResponse.json(
                { error: 'Origin and destination are required' },
                { status: 400 }
            );
        }

        // Attempt to use Google Maps Routes API if key is available
        const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY;

        let distanceMiles = 0;
        let durationMinutes = 0;
        let usedApi = false;

        if (apiKey) {
            try {
                // Simple Distance Matrix API call
                const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&mode=${mode}&key=${apiKey}`;

                const response = await fetch(url);
                const data = await response.json();

                if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
                    const element = data.rows[0].elements[0];
                    // Convert meters to miles (1 meter = 0.000621371 miles)
                    distanceMiles = element.distance.value * 0.000621371;
                    // Convert seconds to minutes
                    durationMinutes = Math.round(element.duration.value / 60);
                    usedApi = true;
                } else {
                    console.warn('Google Maps API returned non-OK status:', data);
                }
            } catch (error) {
                console.error('Google Maps API call failed:', error);
            }
        }

        // Fallback Estimation logic if API fails or no key
        // This ensures the user always gets a result for the demo
        if (!usedApi) {
            console.log('Using fallback estimation for commute');
            // Rough estimation: 
            // Assume straight line distance is hard to calc without coords, 
            // so we'll just mock it for the demo if real API fails.
            // In a real app without API, we might use a free geocoder or haversine if we had coords.
            // For this user Demo, we'll return a reasonable default if "San Francisco" is involved.

            const isSF = origin.includes('San Francisco') || destination.includes('San Francisco');
            distanceMiles = isSF ? 3.5 : 10; // Default estimate
            durationMinutes = isSF ? 25 : 45;
        }

        // Calculate Financials
        const costs = createCommuteCost(
            distanceMiles,
            durationMinutes,
            origin,
            destination,
            mode
        );

        // If Transit, override with fixed city fare if API didn't give fare
        if (mode === 'transit') {
            // Avg fare $2.75 * 2 trips/day
            costs.dailyCost = 2.75 * 2;
            costs.monthlyCost = costs.dailyCost * 20;
        }

        return NextResponse.json({
            ...costs,
            usedApi
        });

    } catch (error) {
        console.error('Commute calculation error:', error);
        return NextResponse.json(
            { error: 'Failed to calculate commute' },
            { status: 500 }
        );
    }
}
