import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { SharedArray } from 'k6/data';
import { Counter, Trend } from 'k6/metrics';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

const loginCounter = new Counter('successful_logins');
const loginTimer = new Trend('login_response_time');

const userData = new SharedArray('users', function () {
  return papaparse.parse(open('../data/users.csv'), { header: true }).data;
});

export const options = {
  stages: [{ duration: '10s', target: 5 }, { duration: '20s', target: 5 }, { duration: '10s', target: 0 }],
  thresholds: {
    'login_response_time': ['p(95)<250'],
    'successful_logins': ['count>20'],
  },
};

export default function () {
  const userIndex = (__VU - 1) % userData.length;
  const currentUser = userData[userIndex];

  // PHASE 1: GET the page to find the dynamic value
  group('01_Get_Login_Token', function () {
    const res = http.get('https://test.k6.io/my_messages.php');

    // CORRELATION: Find a hidden input field (simulating a CSRF token)
    // On test.k6.io, we'll just grab the text of the <h2> to prove it works
    const capturedValue = res.html().find('h2').text(); 
    
    // Store it on the VU's "context" (this is like saving to a parameter)
    const myToken = capturedValue.trim();
    console.log(`VU ${__VU} captured value: ${myToken}`);

    // Check if we actually caught it
    check(res, { 'token captured': (r) => myToken.length > 0 });

    // Save the token for the next step
    vars['token'] = myToken;
  });

  // Create a local variable store for this iteration
  let vars = {};

  sleep(1);

  // PHASE 2: Use the correlated value in the POST
  group('02_Login_With_Token', function () {
    const res = http.post('https://test.k6.io/login.php', {
      login: currentUser.username,
      password: currentUser.password,
      token: vars['token'], // Using the correlated value!
    });

    loginTimer.add(res.timings.duration);
    const isOk = check(res, { 'login status is 200': (r) => r.status === 200 });
    if (isOk) { loginCounter.add(1); }
  });

  sleep(1);
}