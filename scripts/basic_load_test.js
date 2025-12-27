import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

export const options = {
  stages: [
    { duration: '5s', target: 5 },
    { duration: '10s', target: 5 },
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    'http_req_failed': ['rate<0.01'], 
  },
};

export default function () {
  // Targeting the homepage which is WAF-friendly for GET requests
  const res = http.get('https://test.k6.io/');
  
  check(res, {
    'Status is 200': (r) => r.status === 200,
    'Page content verified': (r) => r.body.includes('Collection of simple web-pages'),
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    "summary.html": htmlReport(data),
  };
}