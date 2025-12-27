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
  // Use a very specific, modern User-Agent
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  
  stages: [
    { duration: '5s', target: 5 }, 
    { duration: '10s', target: 5 }, 
    { duration: '5s', target: 0 }
  ],
  thresholds: {
    'http_req_failed': ['rate<0.01'], 
  },
};

export default function () {
  const userIndex = (__VU - 1) % userData.length;
  const currentUser = userData[userIndex];

  // 1. Visit the page to establish a session (and get cookies)
  group('01_Get_Login_Page', function () {
    const res = http.get('https://test.k6.io/my_messages.php', {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });
    
    check(res, { 'Login Page Loaded': (r) => r.status === 200 });
  });

  sleep(1);

  // 2. Submit the login with full browser headers
  group('02_Post_Login_Credentials', function () {
    // We send the payload as a string to ensure strict encoding
    const payload = `login=${encodeURIComponent(currentUser.username)}&password=${encodeURIComponent(currentUser.password)}`;

    const params = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'https://test.k6.io',
        'Referer': 'https://test.k6.io/my_messages.php',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
      },
    };

    const res = http.post('https://test.k6.io/login.php', payload, params);

    loginTimer.add(res.timings.duration);
    
    const isOk = check(res, { 
      'Login Successful (200/302)': (r) => r.status === 200 || r.status === 302 
    });
    
    if (isOk) {
      loginCounter.add(1);
    } else {
      // Log the first bit of the body to see if there's a specific WAF message
      console.log(`ERROR [VU ${__VU}]: Status ${res.status}. Body preview: ${res.body.substring(0, 50)}`);
    }
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    "/summary.html": htmlReport(data),
  };
}