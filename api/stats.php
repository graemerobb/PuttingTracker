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
  'touch_drill_uphill' => ['pb' => 'lower'],
  'touch_drill_downhill' => ['pb' => 'lower'],
  'lag_distance' => ['pb' => 'lower'],
  'short_makes' => ['pb' => 'higher', 'tourTarget' => 12],
  'mid_makes' => ['pb' => 'higher', 'tourTarget' => 9],
  'win_on_tour' => ['pb' => 'higher', 'tourTarget' => 20],
];

function game_value(string $gameId, array $game): ?float {
  if (!($game['completed'] ?? false)) return null;

  if ($gameId === 'touch_drill_uphill' || $gameId === 'touch_drill_downhill') {
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
  // home_base is non-quantitative; return 1 if we have anything worth showing
  if ($gameId === 'home_base') {
    // Home base has no quantitative score; treat completion as 1.0
    return 1.0;
  }

  if ($gameId === 'win_on_tour') {
    $v = $game['result']['score'] ?? null;
    if (!is_numeric($v)) $v = $game['result']['points'] ?? null;
    return is_numeric($v) ? (float)$v : null;
  }
  return null;
}

function game_display(string $gameId, array $game, array $def): string {
  if (!($game['completed'] ?? false)) return '—';

  if ($gameId === 'home_base') {
    $note = $game['result']['note'] ?? '';
    $note = is_string($note) ? trim($note) : '';
    if ($note !== '') return $note;   // show last note
    return (($game['completed'] ?? false) ? 'Done' : '—');
  }

  if ($gameId === 'touch_drill_uphill' || $gameId === 'touch_drill_downhill') {
    $v = $game['result']['attemptsToComplete'] ?? null;
    return is_numeric($v) ? ((int)$v . ' attempts') : '—';
  }

  if ($gameId === 'lag_distance') {
    $v = $game['result']['puttsToReachTarget'] ?? null;
    return is_numeric($v) ? ((int)$v . ' putts') : '—';
  }

  if ($gameId === 'short_makes' || $gameId === 'mid_makes') {
    $m = $game['result']['score']['makes'] ?? null;
    if (!is_numeric($m)) return '—';

    $total = $game['result']['totalPutts'] ?? 18; // uses schema if present
    $t = $def['tourTarget'] ?? null;

    if (is_numeric($t)) {
      return ((int)$m . ' / ' . (int)$total . ' (tour ' . (int)$t . ')');
    }
    return ((int)$m . ' / ' . (int)$total);
  }

  if ($gameId === 'win_on_tour') {
    $v = $game['result']['score'] ?? null;
    if (!is_numeric($v)) $v = $game['result']['points'] ?? null;

    $t = $def['tourTarget'] ?? 20;

    return is_numeric($v)
      ? ((int)$v . ' (Tour win ' . (int)$t . ')')
      : '—';
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
