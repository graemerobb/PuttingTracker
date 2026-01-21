<?php
// File: /public_html/puttingtracker/api/sessions.php
// Purpose:
//   POST -> append a session payload (JSON) as 1 line in sessions.jsonl
//   GET  -> return session history for a playerId (most recent first)
//
// Storage format: JSONL (one JSON object per line)
// IMPORTANT: ensure ../data is NOT web-browsable.

declare(strict_types=1);

// ----------------------
// Basic headers (CORS + JSON)
// ----------------------
header('Content-Type: application/json; charset=utf-8');

// CORS: adjust if you later host frontend on a different domain
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowOrigins = [
  // e.g. 'https://yourdomain.com',
  // e.g. 'http://localhost:5173',
];
if ($origin && (empty($allowOrigins) || in_array($origin, $allowOrigins, true))) {
  header("Access-Control-Allow-Origin: {$origin}");
  header("Vary: Origin");
} else {
  // same-origin by default (no ACAO header) — simplest + safest
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

// ----------------------
// Helpers
// ----------------------
function respond(int $status, array $body): void {
  http_response_code($status);
  echo json_encode($body, JSON_UNESCAPED_SLASHES);
  exit;
}

function is_valid_iso8601(?string $s): bool {
  if (!$s) return false;
  // Loose ISO check; we can be stricter later
  return (bool)preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+\-]\d{2}:\d{2})$/', $s);
}

function safe_filename(string $playerId): string {
  // Allow simple ids only
  if (!preg_match('/^[a-zA-Z0-9_\-]{1,64}$/', $playerId)) return '';
  return $playerId;
}

// ----------------------
// Storage path
// ----------------------
// put data outside /api and ideally deny direct web access to /data.
$baseDir = realpath(__DIR__ . '/..'); // /puttingtracker
if ($baseDir === false) {
  respond(500, ['ok' => false, 'error' => 'Server misconfig: baseDir not found']);
}

$dataDir = $baseDir . '/data';
$dataFile = $dataDir . '/sessions.jsonl';

// Ensure data dir exists
if (!is_dir($dataDir)) {
  if (!mkdir($dataDir, 0750, true)) {
    respond(500, ['ok' => false, 'error' => 'Server could not create data directory']);
  }
}

// ----------------------
// Routing
// ----------------------
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'POST') {
  // ----- Read body
  $raw = file_get_contents('php://input');
  if ($raw === false || trim($raw) === '') {
    respond(400, ['ok' => false, 'error' => 'Empty request body']);
  }

  $payload = json_decode($raw, true);
  if (!is_array($payload)) {
    respond(400, ['ok' => false, 'error' => 'Invalid JSON body']);
  }

  // ----- Minimal validation (results-only model)
  $schemaVersion = $payload['schemaVersion'] ?? null;
  $app = $payload['app'] ?? null;
  $session = $payload['session'] ?? null;

  if ($schemaVersion !== '1.0') {
    respond(400, ['ok' => false, 'error' => 'schemaVersion must be "1.0"']);
  }
  if ($app !== 'PuttingTracker') {
    respond(400, ['ok' => false, 'error' => 'app must be "PuttingTracker"']);
  }
  if (!is_array($session)) {
    respond(400, ['ok' => false, 'error' => 'session must be an object']);
  }

  $sessionId = $session['sessionId'] ?? null;
  $playerId  = $session['playerId'] ?? null;
  $startedAt = $session['startedAt'] ?? null;
  $endedAt   = $session['endedAt'] ?? null;
  $games     = $session['games'] ?? null;

  if (!is_string($sessionId) || $sessionId === '') {
    respond(400, ['ok' => false, 'error' => 'session.sessionId is required']);
  }
  if (!is_string($playerId) || safe_filename($playerId) === '') {
    respond(400, ['ok' => false, 'error' => 'session.playerId is required (A-Z a-z 0-9 _ - only, max 64)']);
  }
  if (!is_valid_iso8601($startedAt) || !is_valid_iso8601($endedAt)) {
    respond(400, ['ok' => false, 'error' => 'session.startedAt and session.endedAt must be ISO8601 with timezone']);
  }
  if (!is_array($games)) {
    respond(400, ['ok' => false, 'error' => 'session.games must be an array']);
  }

  // ----- Append to JSONL safely with file lock
  $line = json_encode($payload, JSON_UNESCAPED_SLASHES);
  if ($line === false) {
    respond(500, ['ok' => false, 'error' => 'Failed to encode JSON']);
  }

  $fp = fopen($dataFile, 'ab');
  if ($fp === false) {
    respond(500, ['ok' => false, 'error' => 'Could not open data file for writing']);
  }

  try {
    if (!flock($fp, LOCK_EX)) {
      fclose($fp);
      respond(500, ['ok' => false, 'error' => 'Could not lock data file']);
    }

    // Optional: lightweight idempotency check (prevents duplicates)
    // For low volume, we can scan recent lines for same sessionId.
    // Comment out if you want pure append.
    $duplicate = false;
    $tailLines = 200; // scan last N lines
    $recent = read_tail_lines($dataFile, $tailLines);
    foreach ($recent as $r) {
      $obj = json_decode($r, true);
      if (is_array($obj) && ($obj['session']['sessionId'] ?? null) === $sessionId) {
        $duplicate = true;
        break;
      }
    }
    if ($duplicate) {
      flock($fp, LOCK_UN);
      fclose($fp);
      respond(409, ['ok' => false, 'error' => 'Duplicate sessionId (already stored)', 'sessionId' => $sessionId]);
    }

    $written = fwrite($fp, $line . PHP_EOL);
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    if ($written === false) {
      respond(500, ['ok' => false, 'error' => 'Write failed']);
    }

    respond(201, [
      'ok' => true,
      'stored' => true,
      'sessionId' => $sessionId,
      'playerId' => $playerId
    ]);

  } catch (Throwable $e) {
    // Best-effort unlock/close
    if (is_resource($fp)) {
      @flock($fp, LOCK_UN);
      @fclose($fp);
    }
    respond(500, ['ok' => false, 'error' => 'Server error', 'detail' => $e->getMessage()]);
  }

} elseif ($method === 'GET') {
  // Query params
  $playerId = $_GET['playerId'] ?? '';
  $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;

  if (safe_filename($playerId) === '') {
    respond(400, ['ok' => false, 'error' => 'playerId query param is required (A-Z a-z 0-9 _ - only, max 64)']);
  }
  if ($limit <= 0) $limit = 20;
  if ($limit > 200) $limit = 200;

  if (!file_exists($dataFile)) {
    respond(200, ['ok' => true, 'playerId' => $playerId, 'count' => 0, 'sessions' => []]);
  }

  $sessions = [];

  // Read file line by line; keep matches; return most recent first (reverse at end).
  $fh = fopen($dataFile, 'rb');
  if ($fh === false) {
    respond(500, ['ok' => false, 'error' => 'Could not open data file for reading']);
  }

  while (($line = fgets($fh)) !== false) {
    $line = trim($line);
    if ($line === '') continue;

    $obj = json_decode($line, true);
    if (!is_array($obj)) continue;

    $sess = $obj['session'] ?? null;
    if (!is_array($sess)) continue;

    if (($sess['playerId'] ?? null) === $playerId) {
      // Keep only the session object or the whole envelope? returning whole envelope is fine.
      $sessions[] = $obj;
    }
  }
  fclose($fh);

  // Sort most recent first by startedAt (string ISO8601 sorts lexicographically if consistent)
  usort($sessions, function($a, $b) {
    $sa = $a['session']['startedAt'] ?? '';
    $sb = $b['session']['startedAt'] ?? '';
    return strcmp($sb, $sa);
  });

  $sessions = array_slice($sessions, 0, $limit);

  respond(200, [
    'ok' => true,
    'playerId' => $playerId,
    'count' => count($sessions),
    'sessions' => $sessions
  ]);

} else {
  respond(405, ['ok' => false, 'error' => 'Method not allowed']);
}

// ----------------------
// Tail helper (for idempotency scan)
// ----------------------
function read_tail_lines(string $filePath, int $maxLines): array {
  if (!file_exists($filePath)) return [];
  $fp = fopen($filePath, 'rb');
  if ($fp === false) return [];

  $buffer = '';
  $chunkSize = 4096;
  $pos = -1;
  $lines = [];

  fseek($fp, 0, SEEK_END);
  $filesize = ftell($fp);
  if ($filesize === 0) { fclose($fp); return []; }

  $read = 0;
  while (count($lines) <= $maxLines && $read < $filesize) {
    $seek = min($chunkSize, $filesize - $read);
    $read += $seek;
    fseek($fp, -$read, SEEK_END);
    $chunk = fread($fp, $seek);
    if ($chunk === false) break;
    $buffer = $chunk . $buffer;
    $lines = preg_split("/\r\n|\n|\r/", $buffer);
  }
  fclose($fp);

  // Remove possible partial first line
  if (count($lines) > $maxLines) {
    $lines = array_slice($lines, -$maxLines);
  }

  // Filter empties
  return array_values(array_filter(array_map('trim', $lines), fn($l) => $l !== ''));
}
