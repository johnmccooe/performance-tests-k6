import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { SharedArray } from 'k6/data';
import { Counter, Trend } from 'k6/metrics';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

// Custom Metrics
const loginCounter = new Counter('successful_logins');
const loginTimer = new Trend('login_response_time');

// Load User Data
const userData = new SharedArray('users', function () {
  return papaparse.parse(open('../data/users.csv'), { header: true }).data;
});

export const options = {
  stages: [
    { duration: '5s', target: 5 }, 
    { duration: '10s', target: 5 }, 
    { duration: '5s', target: 0 }
  ],
  thresholds: {
    // 1. Latency: 95% of requests must be under 500ms
    'login_response_time': ['p(95)<500'],

    // 2. Error Rate: Less than 1% of all HTTP requests can fail
    'http_req_failed': ['rate<0.01'],

    // 3. Throughput: Ensure we are actually hitting at least 20 logins per test run
    'successful_logins': ['count>=20'], 
  },
};

export default function () {
  let vars = {}; 
  const userIndex = (__VU - 1) % userData.length;
  const currentUser = userData[userIndex];

  group('01_Get_Login_Token', function () {
    const res = http.get('https://test.k6.io/my_messages.php');
    
    // CORRELATION: Extract the H2 text
    const capturedValue = res.html().find('h2').text(); 
    vars['token'] = capturedValue.trim();
    
    console.log(`DEBUG [VU ${__VU}]: Extracted Token -> "${vars['token']}"`);
    
    check(res, { 'Get Token Status is 200': (r) => r.status === 200 });
  });

  sleep(1);

  group('02_Login_With_Token', function () {
    console.log(`DEBUG [VU ${__VU}]: Injecting Token into Login -> "${vars['token']}"`);

    const res = http.post('https://test.k6.io/login.php', {
      login: currentUser.username,
      password: currentUser.password,
      redir: vars['token'], 
    });

    loginTimer.add(res.timings.duration);
    
    const isOk = check(res, { 'Login Status is 200 or 302': (r) => r.status === 200 || r.status === 302 });
    
    if (isOk) {
      loginCounter.add(1);
    } else {
      console.log(`ERROR [VU ${__VU}]: Login failed with status ${res.status}`);
    }
  });

  sleep(1);
}

// Generate the HTML Report at the root of the container
export function handleSummary(data) {
  return {
    "/summary.html": htmlReport(data),
  };

}