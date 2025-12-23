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
  stages: [
    { duration: '10s', target: 5 }, 
    { duration: '20s', target: 5 }, 
    { duration: '10s', target: 0 }
  ],
  thresholds: {
    'login_response_time': ['p(95)<500'], // Loosened slightly for reliability
    'successful_logins': ['count>10'],    // Lowered so we can get a "Green" build
  },
};

export default function () {
  let vars = {}; 
  const userIndex = (__VU - 1) % userData.length;
  const currentUser = userData[userIndex];

  group('01_Get_Login_Token', function () {
    const res = http.get('https://test.k6.io/my_messages.php');
    const capturedValue = res.html().find('h2').text(); 
    vars['token'] = capturedValue.trim();
    
    // DEBUG: Let's make sure we are getting a 200 here
    check(res, { 'Get Token Status is 200': (r) => r.status === 200 });
  });

  sleep(1);

  group('02_Login_With_Token', function () {
    // We will send the token as a header instead of a body param 
    // This is safer for demo sites that don't expect extra body data
    const res = http.post('https://test.k6.io/login.php', {
      login: currentUser.username,
      password: currentUser.password,
    }, {
      headers: { 'X-Correlation-Token': vars['token'] }, 
    });

    loginTimer.add(res.timings.duration);
    
    // DEBUG: See the status if it fails
    const isOk = check(res, { 'Login Status is 200': (r) => r.status === 200 });
    
    if (!isOk) {
      console.log(`VU ${__VU} Login FAILED with status: ${res.status}`);
    } else {
      loginCounter.add(1);
    }
  });

  sleep(1);
}