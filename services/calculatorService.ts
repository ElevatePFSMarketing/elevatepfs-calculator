
import type { CalculationInput, CalculationResult } from '../types';

export function calculateSavings(input: CalculationInput): CalculationResult {
    const { chemoChairs, oncologists, bedCount, edVisits, is340b, isMedicaidExpanded } = input;

    let additionalRevenue = 0;
    let hospitalSavings = 0;
    
    // Intermediate values for potential detailed breakdown
    let revenueFromOncologists = 0;
    let revenueFromChairs = 0;
    let savingsFromOncologists = 0;
    let savingsFromChairs = 0;
    let savingsFromVisits = 0;
    let savingsFromBeds = 0;

    if (is340b && isMedicaidExpanded) {
        // Scenario #1: 340B Yes, Medicaid Expanded Yes
        revenueFromOncologists = oncologists * 100000;
        revenueFromChairs = chemoChairs * 9000;
        additionalRevenue = (revenueFromOncologists + revenueFromChairs) / 2;
        
        savingsFromVisits = edVisits * 0;
        savingsFromBeds = bedCount * 0;
        savingsFromOncologists = oncologists * 50000;
        savingsFromChairs = chemoChairs * 7000;
        hospitalSavings = ((savingsFromOncologists + savingsFromChairs) / 2) + ((savingsFromVisits + savingsFromBeds) / 2);
    } else if (!is340b && isMedicaidExpanded) {
        // Scenario #2: 340B No, Medicaid Expanded Yes
        revenueFromOncologists = oncologists * 100000;
        revenueFromChairs = chemoChairs * 9000;
        additionalRevenue = (revenueFromOncologists + revenueFromChairs) / 2;
        
        savingsFromVisits = edVisits * 0;
        savingsFromBeds = bedCount * 0;
        savingsFromOncologists = oncologists * 25000;
        savingsFromChairs = chemoChairs * 3000;
        hospitalSavings = ((savingsFromOncologists + savingsFromChairs) / 2) + ((savingsFromVisits + savingsFromBeds) / 2);
    } else if (is340b && !isMedicaidExpanded) {
        // Scenario #3: 340B Yes, Medicaid Expanded No
        revenueFromOncologists = oncologists * 90000;
        revenueFromChairs = chemoChairs * 8000;
        additionalRevenue = (revenueFromOncologists + revenueFromChairs) / 2;
        
        savingsFromVisits = edVisits * 4;
        savingsFromBeds = bedCount * 500;
        savingsFromOncologists = oncologists * 120000;
        savingsFromChairs = chemoChairs * 14000;
        hospitalSavings = ((savingsFromOncologists + savingsFromChairs) / 2) + ((savingsFromVisits + savingsFromBeds) / 2);
    } else {
        // Scenario #4: 340B No, Medicaid Expanded No
        revenueFromOncologists = oncologists * 80000;
        revenueFromChairs = chemoChairs * 8000;
        additionalRevenue = (revenueFromOncologists + revenueFromChairs) / 2;
        
        savingsFromVisits = edVisits * 1;
        savingsFromBeds = bedCount * 100;
        savingsFromOncologists = oncologists * 200000;
        savingsFromChairs = chemoChairs * 26000;
        hospitalSavings = ((savingsFromOncologists + savingsFromChairs) / 2) + ((savingsFromVisits + savingsFromBeds) / 2);
    }

    const total = additionalRevenue + hospitalSavings;

    return {
        total: Math.round(total),
        additionalRevenue: Math.round(additionalRevenue),
        hospitalSavings: Math.round(hospitalSavings),
        // Per-service-line view of the same numbers (each contribution is halved
        // exactly as in the scenario formulas above, so the four lines sum to total)
        breakdown: {
            medicalOncology: Math.round((revenueFromOncologists + savingsFromOncologists) / 2),
            infusion: Math.round((revenueFromChairs + savingsFromChairs) / 2),
            emergencyDepartment: Math.round(savingsFromVisits / 2),
            inpatient: Math.round(savingsFromBeds / 2),
        },
    };
}
