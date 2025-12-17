import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  //vus: 5,
  //duration: '10s',
  stages: [
    { duration: '10s', target: 5 }, // Fast ramp for testing
    { duration: '20s', target: 5 }, 
    { duration: '10s', target: 0 }, 
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // Fail if more than 1% of requests fail
    http_req_duration: ['p(95)<150'], // Fail if 95% of requests take longer than 200ms
  },
};

export default function () {

  group('BP01_Homepage_Load', function () {
    const res = http.get('https://test.k6.io');
    
    check(res, {
      'status is 200': (r) => r.status === 200,
      'verify homepage text': (r) => r.body.includes('Collection of simple web-pages'),
    });
  });

  sleep(1);

  group('BP02_Login_Page_Access', function () {
    const res = http.get('https://test.k6.io/my_messages.php');
    
    check(res, {
      'login page status is 200': (r) => r.status === 200,
    });
  });

  sleep(1);
}