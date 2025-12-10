import http from 'k6/http';
import { check, sleep } from 'k6';

// 1. **Configuration Options:** // This is the core setup, defining the load profile and targets.
export const options = {
  // Key Performance Indicators (KPIs) - The test will FAIL if these thresholds are not met!
  // This is a powerful feature for enforcing performance as a quality gate.
  thresholds: {
    // 95% of all HTTP request durations must be less than 500ms
    'http_req_duration': ['p(95) < 500'], 
    // The rate of failed checks (errors) must be less than 1%
    'checks': ['rate>0.99'], 
  },
  
  // Stages/Scenarios: Defines how the Virtual Users (VUs) ramp up and down.
  scenarios: {
    // The name of this scenario (can be anything descriptive)
    load_model: {
      executor: 'ramping-vus',
      // Start with 0 VUs, ramp up to 10 over 10s, hold for 10s, ramp down to 0 over 10s
      startVUs: 0,
      stages: [
        { duration: '10s', target: 10 }, // Ramp up to 10 VUs
        { duration: '10s', target: 10 }, // Stay at 10 VUs
        { duration: '10s', target: 0 },  // Ramp down to 0 VUs
      ],
      gracefulRampDown: '30s', // Wait time for users to finish their final iteration
    },
  },
};


// 2. **Default Function (The Virtual User Logic):**
// This function runs repeatedly for every Virtual User (VU) for the duration of the test.
export default function () {
  // Send a GET request to a public API endpoint
  const res = http.get('https://test-api.k6.io/public/crocodiles/1/');

  // Use the 'check' function to validate the response.
  // This is k6's assertion mechanism. Checks that fail are counted as errors.
  check(res, {
    // Check 1: Did the HTTP status code match 200 (OK)?
    'is status 200': (r) => r.status === 200, 
    // Check 2: Does the response body contain a specific string?
    'is crocodile name correct': (r) => r.body.includes('Bert'), 
  });
  
  // Think time: Wait for 1 second before the VU starts the next iteration.
  sleep(1); 
}