import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { SharedArray } from 'k6/data';
import { Counter, Trend } from 'k6/metrics'; 
// Import papaparse to handle the CSV data
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

// 1. Initialize custom metrics
const loginCounter = new Counter('successful_logins');
const loginTimer = new Trend('login_response_time'); 

// 1. Load the CSV file into a SharedArray
const userData = new SharedArray('users', function () {
  // Use the path relative to where k6 is running inside Docker
  return papaparse.parse(open('../data/users.csv'), { header: true }).data;
});

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
  // 2. Pick a unique user based on the VU ID
  // __VU starts at 1. We use modulo to wrap around if there are more VUs than data rows.
  const userIndex = (__VU - 1) % userData.length;
  const currentUser = userData[userIndex];

  group('01_Homepage_Load', function () {
    http.get('https://test.k6.io/');
  });

  sleep(1);

  group('02_Login_Page_Access', function () {
    // 3. Use the data from the CSV in your request
    console.log(`VU ${__VU} is logging in as: ${currentUser.username}`);

    const res = http.get('https://test.k6.io/my_messages.php');
    
    loginTimer.add(res.timings.duration);
    
    const isOk = check(res, { 'login status is 200': (r) => r.status === 200 });
    
    if (isOk) {
      loginCounter.add(1);
    }
  });

  sleep(1);
}