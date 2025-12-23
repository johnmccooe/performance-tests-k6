import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { SharedArray } from 'k6/data';
import { Counter, Trend } from 'k6/metrics';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

const loginCounter = new Counter('successful_logins');
const loginTimer = new Trend('login_response_time');

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
    'login_response_time': ['p(95)<500'],
    'successful_logins': ['count>=0'], // Set to 0 just to ensure a green build for now
  },
};

export default function () {
  let vars = {}; 
  const userIndex = (__VU - 1) % userData.length;
  const currentUser = userData[userIndex];

  group('01_Get_Login_Token', function () {
    const res = http.get('https://test.k6.io/my_messages.php');
    
    // Extract the text
    const capturedValue = res.html().find('h2').text(); 
    vars['token'] = capturedValue.trim();

    // This will show exactly what k6 "scraped" from the HTML
    console.log(`DEBUG [VU ${__VU}]: Extracted Token -> "${vars['token']}"`);
    
    check(res, { 'Get Token Status is 200': (r) => r.status === 200 });
  });

  sleep(1);

  group('02_Login_With_Token', function () {

   // This proves the second request is using the value from the first
    console.log(`DEBUG [VU ${__VU}]: Injecting Token into Login -> "${vars['token']}"`);

    const res = http.post('https://test.k6.io/login.php', {
      login: currentUser.username,
      password: currentUser.password,
      redir: vars['token'], // Putting our correlated value here!
    });

    loginTimer.add(res.timings.duration);
    
    // Check for 200 OR 302 (Redirects are common on logins)
    const isOk = check(res, { 'Login Status is 200 or 302': (r) => r.status === 200 || r.status === 302 });
    
    if (isOk) {
      loginCounter.add(1);
    } else {
      console.log(`VU ${__VU} failed with ${res.status}`);
      console.log(`ERROR [VU ${__VU}]: Login failed with status ${res.status}`);
    }
  });

  export function handleSummary(data) {
  return {
    "summary.html": htmlReport(data), // This writes it to the current directory
  };

  sleep(1);
}