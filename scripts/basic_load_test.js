import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

const userData = new SharedArray('users', function () {
  return papaparse.parse(open('../data/users.csv'), { header: true }).data;
});

export const options = {
  // Use a real-world Chrome User-Agent string
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  vus: 1,
  iterations: 1,
};

export default function () {
  const currentUser = userData[0];

  // 1. GET the login page
  const res1 = http.get('https://test.k6.io/my_messages.php');
  
  sleep(1);

  // 2. POST the login - matching EXACTLY what a browser sends
  const payload = {
    login: currentUser.username,
    password: currentUser.password,
  };

  const params = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Origin': 'https://test.k6.io',
      'Referer': 'https://test.k6.io/my_messages.php',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-User': '?1',
    },
    // This is key: follow redirects to see where CloudFront sends us
    redirects: 5,
  };

  const res2 = http.post('https://test.k6.io/login.php', payload, params);

  console.log(`POST Status: ${res2.status}`);
  
  check(res2, {
    'Is Login Successful': (r) => r.status === 200 && r.body.includes('Welcome'),
  }) || console.log(`WAF Response: ${res2.body.substring(0, 200)}`);
}