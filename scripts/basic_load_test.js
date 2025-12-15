import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '10s',
  thresholds: {
    http_req_failed: ['rate<0.01'], // Fail if more than 1% of requests fail
    http_req_duration: ['p(95)<10'], // Fail if 95% of requests take longer than 200ms
  },
};

export default function () {
  const res = http.get('https://test.k6.io');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'verify homepage text': (r) => r.body.includes('Collection of simple web-pages'),
  });
  sleep(1);
}