<?php

$settings = array();

$tmp = array(
    //временные

    /* 'assets_path' => array(
         'value' => '{base_path}useravatar/assets/components/useravatar/',
         'xtype' => 'textfield',
         'area'  => 'useravatar_temp',
     ),
     'assets_url'  => array(
         'value' => '/useravatar/assets/components/useravatar/',
         'xtype' => 'textfield',
         'area'  => 'useravatar_temp',
     ),
     'core_path'   => array(
         'value' => '{base_path}useravatar/core/components/useravatar/',
         'xtype' => 'textfield',
         'area'  => 'useravatar_temp',
     ),*/

    //временные

);

foreach ($tmp as $k => $v) {
    /* @var modSystemSetting $setting */
    $setting = $modx->newObject('modSystemSetting');
    $setting->fromArray(array_merge(
        array(
            'key'       => 'useravatar_' . $k,
            'namespace' => PKG_NAME_LOWER,
        ), $v
    ), '', true, true);

    $settings[] = $setting;
}

unset($tmp);
return $settings;
