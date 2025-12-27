import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

// Load users
const userData = new SharedArray('users', function () {
  return papaparse.parse(open('../data/users.csv'), { header: true }).data;
});

export const options = {
  // 1. Force HTTP 1.1 to rule out protocol rejection
  httpV2KeepAliveMaxIdle: 0, 
  // 2. Just 1 VU for 1 iteration to see clear logs
  vus: 1,
  iterations: 1,
  thresholds: {
    'http_req_failed': ['rate<0.01'],
  },
};

export default function () {
  const currentUser = userData[0];

  // --- STEP 1: Establish Session ---
  console.log("--- Step 1: GET Login Page ---");
  const getRes = http.get('https://test.k6.io/my_messages.php');
  
  // Check if we got a cookie
  const jar = http.cookieJar();
  const cookies = jar.cookiesForURL(getRes.url);
  console.log(`Cookies found after GET: ${JSON.stringify(cookies)}`);

  sleep(2);

  // --- STEP 2: POST Login ---
  console.log("--- Step 2: POST Credentials ---");
  
  // k6 automatically handles the Content-Type and Encoding when using an object
  const payload = {
    login: currentUser.username,
    password: currentUser.password,
  };

  const params = {
    headers: {
      'Referer': 'https://test.k6.io/my_messages.php',
      'Origin': 'https://test.k6.io',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    },
  };

  const postRes = http.post('https://test.k6.io/login.php', payload, params);

  console.log(`POST Status: ${postRes.status}`);
  
  const isOk = check(postRes, {
    'Success (200 or 302)': (r) => r.status === 200 || r.status === 302,
  });

  if (!isOk) {
    console.log(`FAILED! Response Header: ${JSON.stringify(postRes.headers)}`);
    console.log(`FAILED! Body excerpt: ${postRes.body.substring(0, 100)}`);
  }
}

export function handleSummary(data) {
  return { "/summary.html": htmlReport(data) };
}