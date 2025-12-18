import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Trend } from 'k6/metrics'; 

// 1. Initialize custom metrics
const loginCounter = new Counter('successful_logins');
const loginTimer = new Trend('login_response_time'); 

export const options = {
  stages: [
    { duration: '10s', target: 5 }, 
    { duration: '20s', target: 5 }, 
    { duration: '10s', target: 0 }, 
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], 
    // 2. Specific SLA for the login transaction
    'login_response_time': ['p(95)<200'], 
    'successful_logins': ['count>50'], 
  },
};

export default function () {
  group('01_Homepage_Load', function () {
    http.get('https://test.k6.io/');
  });

  sleep(1);

  group('02_Login_Page_Access', function () {
    const res = http.get('https://test.k6.io/my_messages.php');
    
    // 3. Record the timing for JUST this request
    loginTimer.add(res.timings.duration);
    
    const isOk = check(res, { 'login status is 200': (r) => r.status === 200 });
    
    if (isOk) {
      loginCounter.add(1);
    }
  });

  sleep(1);
}