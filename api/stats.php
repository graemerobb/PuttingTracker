<?php
// File: /public_html/puttingtracker/api/stats.php
// GET /puttingtracker/api/stats.php?playerId=ply_001
//
// Reads JSONL sessions file and returns:
//  - last + personal best per game (display-friendly)
//  - sessions count
//
// NOTE: We keep this "light": no giant history payload.

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
  http_response_code(204);
  exit;
}

function respond(int $status, array $body): void {
  http_response_code($status);
  echo json_encode($body, JSON_UNESCAPED_SLASHES);
  exit;
}

function safe_player_id(string $playerId): string {
  return preg_match('/^[a-zA-Z0-9_\-]{1,64}$/', $playerId) ? $playerId : '';
}

$playerId = $_GET['playerId'] ?? '';
$playerId = is_string($playerId) ? trim($playerId) : '';
if (safe_player_id($playerId) === '') {
  respond(400, ['ok' => false, 'error' => 'playerId query param is required (A-Z a-z 0-9 _ - only, max 64)']);
}

$baseDir = realpath(__DIR__ . '/..'); // /puttingtracker
if ($baseDir === false) respond(500, ['ok' => false, 'error' => 'Server misconfig: baseDir not found']);

$dataFile = $baseDir . '/data/sessions.jsonl';
if (!file_exists($dataFile)) {
  respond(200, [
    'ok' => true,
    'playerId' => $playerId,
    'meta' => ['sessionsCount' => 0],
    'games' => new stdClass()
  ]);
}

// Game definitions: pb direction and display formatting
$gameDefs = [
  'home_base' => ['pb' => 'na'],
  'touch_drill' => ['pb' => 'lower'],
  'lag_distance' => ['pb' => 'lower'],
  'short_makes' => ['pb' => 'higher', 'baseline' => 12],
  'mid_makes' => ['pb' => 'higher', 'baseline' => 9],
  'win_on_tour' => ['pb' => 'higher', 'unit' => 'points'],
];

function game_value(string $gameId, array $game): ?float {
  if (!($game['completed'] ?? false)) return null;

  if ($gameId === 'touch_drill') {
    $v = $game['result']['attemptsToComplete'] ?? null;
    return is_numeric($v) ? (float)$v : null;
  }
  if ($gameId === 'lag_distance') {
    $v = $game['result']['puttsToReachTarget'] ?? null;
    return is_numeric($v) ? (float)$v : null;
  }
  if ($gameId === 'short_makes' || $gameId === 'mid_makes') {
    $v = $game['result']['score']['makes'] ?? null;
    return is_numeric($v) ? (float)$v : null;
  }
  if ($gameId === 'home_base') {
    return 1.0;
  }
  if ($gameId === 'win_on_tour') {
    $v = $game['result']['score'] ?? null;
    return is_numeric($v) ? (float)$v : null;
  }

  return null;
}

function game_display(string $gameId, array $game, array $def): string {
  if (!($game['completed'] ?? false)) return '—';

  if ($gameId === 'home_base') return 'Done';

  if ($gameId === 'touch_drill') {
    $v = $game['result']['attemptsToComplete'] ?? null;
    return is_numeric($v) ? ((int)$v . ' attempts') : '—';
  }

  if ($gameId === 'lag_distance') {
    $v = $game['result']['puttsToReachTarget'] ?? null;
    return is_numeric($v) ? ((int)$v . ' putts') : '—';
  }

  if ($gameId === 'short_makes' || $gameId === 'mid_makes') {
    $m = $game['result']['score']['makes'] ?? null;
    $b = $def['baseline'] ?? null;
    if (!is_numeric($m)) return '—';
    if (is_numeric($b)) return ((int)$m . ' / 18 (base ' . (int)$b . ')');
    return ((int)$m . ' / 18');
  }
  if ($gameId === 'win_on_tour') {
    $v = $game['result']['score'] ?? null;
    $unit = $game['result']['unit'] ?? ($def['unit'] ?? 'points');
    if (!is_string($unit) || $unit === '') $unit = 'points';
    return is_numeric($v) ? ((int)$v . ' ' . $unit) : '—';
  }


  return '—';
}

// Track last + pb per game
$gamesOut = [];
foreach ($gameDefs as $gid => $_) {
  $gamesOut[$gid] = [
    'last' => null,
    'pb' => null
  ];
}

$sessionsCount = 0;

// Read file line by line
$fh = fopen($dataFile, 'rb');
if ($fh === false) respond(500, ['ok' => false, 'error' => 'Could not open data file']);

while (($line = fgets($fh)) !== false) {
  $line = trim($line);
  if ($line === '') continue;

  $obj = json_decode($line, true);
  if (!is_array($obj)) continue;

  $sess = $obj['session'] ?? null;
  if (!is_array($sess)) continue;

  if (($sess['playerId'] ?? null) !== $playerId) continue;

  $sessionsCount++;

  $games = $sess['games'] ?? [];
  if (!is_array($games)) continue;

  foreach ($games as $g) {
    if (!is_array($g)) continue;
    $gid = $g['gameId'] ?? null;
    if (!is_string($gid) || !isset($gameDefs[$gid])) continue;
    $def = $gameDefs[$gid];

    // candidate value
    $val = game_value($gid, $g);
    if ($val === null) continue;

    // LAST: we want the most recent by startedAt, but JSONL is append order.
    // We'll compute "last" by comparing startedAt timestamps lexicographically (ISO).
    $startedAt = $sess['startedAt'] ?? '';
    if (!is_string($startedAt)) $startedAt = '';

    $curLast = $gamesOut[$gid]['last'];
    if ($curLast === null || strcmp($startedAt, $curLast['startedAt']) > 0) {
      $gamesOut[$gid]['last'] = [
        'value' => $val,
        'display' => game_display($gid, $g, $def),
        'startedAt' => $startedAt,
        'sessionId' => $sess['sessionId'] ?? null
      ];
    }

    // PB:
    $curPb = $gamesOut[$gid]['pb'];
    if ($curPb === null) {
      $gamesOut[$gid]['pb'] = [
        'value' => $val,
        'display' => game_display($gid, $g, $def),
        'startedAt' => $startedAt,
        'sessionId' => $sess['sessionId'] ?? null
      ];
    } else {
      $better = false;
      if (($def['pb'] ?? 'na') === 'lower') $better = $val < $curPb['value'];
      if (($def['pb'] ?? 'na') === 'higher') $better = $val > $curPb['value'];

      if ($better) {
        $gamesOut[$gid]['pb'] = [
          'value' => $val,
          'display' => game_display($gid, $g, $def),
          'startedAt' => $startedAt,
          'sessionId' => $sess['sessionId'] ?? null
        ];
      }
    }
  }
}
fclose($fh);

// Remove internal startedAt/sessionId from payload if you want.
// I’m leaving them off the response for now (simpler).
foreach ($gamesOut as $gid => $vals) {
  if ($vals['last']) {
    $gamesOut[$gid]['last'] = ['display' => $vals['last']['display'], 'value' => $vals['last']['value']];
  }
  if ($vals['pb']) {
    $gamesOut[$gid]['pb'] = ['display' => $vals['pb']['display'], 'value' => $vals['pb']['value']];
  }
}

respond(200, [
  'ok' => true,
  'playerId' => $playerId,
  'meta' => ['sessionsCount' => $sessionsCount],
  'games' => $gamesOut
]);
