import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Trend } from 'k6/metrics'; // Import Trend

// 2. Define the counter
const loginCounter = new Counter('successful_logins');
const loginTimer = new Trend('login_response_time'); // Define Trend

export const options = {
  //vus: 5,
  //duration: '10s',
  stages: [
    { duration: '10s', target: 5 }, // Fast ramp for testing
    { duration: '20s', target: 5 }, 
    { duration: '10s', target: 0 }, 
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], 
    // We can now set a threshold on our SPECIFIC login timer!
    'login_response_time': ['p(95)<200'], 
    'successful_logins': ['count>50'],
  },
};

export default function () {

  group('BP01_Homepage_Load', function () {
    const res = http.get('https://test.k6.io');
    check(res, {'status is 200': (r) => r.status === 200,});
  });

  sleep(1);

  group('BP02_Login_Page_Access', function () {
    const res = http.get('https://test.k6.io/my_messages.php');

    // Track the duration in our custom Trend
    loginTimer.add(res.timings.duration);
    
    // 3. Only count it if the check passed
    if (res.status === 200) {
      loginCounter.add(1);
    }
  });

  sleep(1);
}