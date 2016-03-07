<?php
/** @noinspection PhpIncludeInspection */
require_once dirname(dirname(dirname(dirname(__FILE__)))) . '/config.core.php';
/** @noinspection PhpIncludeInspection */
require_once MODX_CORE_PATH . 'config/' . MODX_CONFIG_KEY . '.inc.php';
/** @noinspection PhpIncludeInspection */
require_once MODX_CONNECTORS_PATH . 'index.php';
/** @var useravatar $useravatar */
$useravatar = $modx->getService('useravatar', 'useravatar', $modx->getOption('useravatar_core_path', null,
        $modx->getOption('core_path') . 'components/useravatar/') . 'model/useravatar/');
$modx->lexicon->load('useravatar:default');

// handle request
$corePath = $modx->getOption('useravatar_core_path', null, $modx->getOption('core_path') . 'components/useravatar/');
$path = $modx->getOption('processorsPath', $useravatar->config, $corePath . 'processors/');
$modx->request->handleRequest(array(
    'processors_path' => $path,
    'location'        => '',
));