import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  // Define a minimal load for testing the pipeline
  vus: 1, // 1 Virtual User
  duration: '1s', // Run for 1 second
};

export default function () {
  // Replace this with a simple, known-good request (e.g., k6's public site)
  http.get('https://test.k6.io'); 
  sleep(1);
}