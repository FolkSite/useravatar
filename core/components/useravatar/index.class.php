<?php

/**
 * Class useravatarMainController
 */
abstract class useravatarMainController extends modExtraManagerController
{
    /** @var useravatar $useravatar */
    public $useravatar;


    /**
     * @return void
     */
    public function initialize()
    {
        $corePath = $this->modx->getOption('useravatar_core_path', null,
            $this->modx->getOption('core_path') . 'components/useravatar/');
        require_once $corePath . 'model/useravatar/useravatar.class.php';

        $this->useravatar = new useravatar($this->modx);
        $this->addCss($this->useravatar->config['cssUrl'] . 'mgr/main.css');
        $this->addJavascript($this->useravatar->config['jsUrl'] . 'mgr/useravatar.js');
        $this->addHtml('
		<script type="text/javascript">
			useravatar.config = ' . $this->modx->toJSON($this->useravatar->config) . ';
			useravatar.config.connector_url = "' . $this->useravatar->config['connectorUrl'] . '";
		</script>
		');

        parent::initialize();
    }


    /**
     * @return array
     */
    public function getLanguageTopics()
    {
        return array('useravatar:default');
    }


    /**
     * @return bool
     */
    public function checkPermissions()
    {
        return true;
    }
}


/**
 * Class IndexManagerController
 */
class IndexManagerController extends useravatarMainController
{

    /**
     * @return string
     */
    public static function getDefaultController()
    {
        return 'home';
    }
}