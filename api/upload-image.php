<?php
// MMS Prime product-photo upload endpoint.
// Stores images under /uploads/products/ on this website (no ImgBB).
// Only signed-in app users may upload: the caller sends its Supabase
// session token, verified against Supabase Auth. Dealer and
// sales-executive accounts are refused even with a valid session;
// the Products page itself is admin-only in the app.

header('Content-Type: application/json');

define('SUPABASE_URL', 'https://jxejieirdqtepcylfpae.supabase.co');
define('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4ZWppZWlyZHF0ZXBjeWxmcGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MTQxNDcsImV4cCI6MjEwMzM5MDE0N30.CXowo-yMv5_LFoBGW7q_WdOnD47DUL3Cl_GY1utNFkI');
define('UPLOAD_DIR', __DIR__ . '/../uploads/products/');
define('MAX_BYTES', 5 * 1024 * 1024);

function fail($code, $message) {
  http_response_code($code);
  echo json_encode(['error' => $message]);
  exit;
}

function bearer_token() {
  $headers = [];
  if (function_exists('getallheaders')) {
    foreach (getallheaders() as $k => $v) $headers[strtolower($k)] = $v;
  }
  $auth = $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
  if (preg_match('/^Bearer\s+(.+)$/i', trim($auth), $m)) return $m[1];
  return '';
}

function supabase_get_user($token) {
  $url = rtrim(SUPABASE_URL, '/') . '/auth/v1/user';
  $headers = ['apikey: ' . SUPABASE_ANON_KEY, 'Authorization: Bearer ' . $token];
  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_HTTPHEADER => $headers,
      CURLOPT_TIMEOUT => 15,
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
  } else {
    $ctx = stream_context_create(['http' => [
      'method' => 'GET',
      'header' => implode("\r\n", $headers),
      'timeout' => 15,
      'ignore_errors' => true,
    ]]);
    $body = @file_get_contents($url, false, $ctx);
    $code = 0;
    if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) $code = (int) $m[1];
  }
  if ($code !== 200 || !$body) return null;
  $user = json_decode($body, true);
  return is_array($user) && !empty($user['id']) ? $user : null;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') fail(405, 'Method not allowed');

$token = bearer_token();
if ($token === '') fail(401, 'Sign-in required');
$user = supabase_get_user($token);
if ($user === null) fail(401, 'Invalid or expired session');

$role = $user['user_metadata']['role'] ?? $user['app_metadata']['role'] ?? null;
if (in_array($role, ['dealer', 'sales_executive'], true)) fail(403, 'Not allowed');

if (empty($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) fail(400, 'No image received');
$file = $_FILES['image'];
if ($file['size'] > MAX_BYTES) fail(413, 'Image must be under 5MB');

$info = @getimagesize($file['tmp_name']);
$mime_to_ext = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
if ($info === false || !isset($mime_to_ext[$info['mime']])) fail(400, 'File is not a supported image');

if (!is_dir(UPLOAD_DIR) && !@mkdir(UPLOAD_DIR, 0755, true)) fail(500, 'Upload folder unavailable');
$name = bin2hex(random_bytes(16)) . '.' . $mime_to_ext[$info['mime']];
if (!move_uploaded_file($file['tmp_name'], UPLOAD_DIR . $name)) fail(500, 'Could not save image');

echo json_encode(['url' => '/uploads/products/' . $name]);
