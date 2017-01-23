<?php

/** @var array $scriptProperties */
$corePath = $modx->getOption('useravatar_core_path', null,
    $modx->getOption('core_path', null, MODX_CORE_PATH) . 'components/useravatar/');
/** @var UserAvatar $UserAvatar */
$UserAvatar = $modx->getService(
    'UserAvatar',
    'UserAvatar',
    $corePath . 'model/useravatar/',
    array(
        'core_path' => $corePath
    )
);

if (!$UserAvatar) {
    return 'Could not load UserAvatar class!';
}

$tplAuth = $scriptProperties['tplAuth'] = $UserAvatar->getOption('tplAuth', $scriptProperties, 'ua.auth', true);
$tplNoAuth = $scriptProperties['tplNoAuth'] = $UserAvatar->getOption('tplNoAuth', $scriptProperties, 'ua.noauth', true);
$user = $scriptProperties['user'] = $UserAvatar->getOption('user', $scriptProperties, $modx->user->id, true);
$objectName = $scriptProperties['objectName'] = $UserAvatar->getOption('objectName', $scriptProperties, 'UserAvatar', true);
$thumbnail = $scriptProperties['thumbnail'] = (array)json_decode($modx->getOption('thumbnail', $scriptProperties, '{}'), true);

$propkey = $scriptProperties['propkey'] = $modx->getOption('propkey', $scriptProperties, sha1(serialize($scriptProperties)), true);

$UserAvatar->initialize($modx->context->key, $scriptProperties);
$UserAvatar->saveProperties($scriptProperties);
$UserAvatar->loadJsCss($scriptProperties);

$row = array(
    'propkey' => $propkey,
);

if ($modx->user->isAuthenticated($modx->context->key)) {
    $output = $UserAvatar->getChunk($tplAuth,
        array_merge($row, $modx->user->Profile->toArray(), $modx->user->toArray()));
} else {
    $output = $UserAvatar->getChunk($tplNoAuth, $row);
}

if (!empty($tplWrapper) AND (!empty($wrapIfEmpty) OR !empty($output))) {
    $output = $UserAvatar->getChunk($tplWrapper, array('output' => $output));
}
if (!empty($toPlaceholder)) {
    $modx->setPlaceholder($toPlaceholder, $output);
} else {
    return $output;
}

