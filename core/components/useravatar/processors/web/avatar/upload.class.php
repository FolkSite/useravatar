<?php

class modWebUserAvatarUploadProcessor extends modObjectUpdateProcessor
{
    public $classKey = 'modUserProfile';
    public $objectType = 'modUserProfile';
    public $primaryKeyField = 'internalKey';
    public $languageTopics = array('useravatar');
    public $permission = '';

    /** @var UserAvatar $object */
    public $object;
    /** @var UserAvatar $UserAvatar */
    public $UserAvatar;
    /** @var array $imageThumbnail */
    public $thumbnail = array(
        'w'  => 200,
        'h'  => 200,
        'q'  => 90,
        'bg' => 'fff',
        'f'  => 'jpg'
    );
    /** @var null $data */
    protected $data = null;

    public function initialize()
    {

        if (!$this->modx->hasPermission($this->permission)) {
            return $this->modx->lexicon('useravatar_err_permission_denied');
        }

        $this->UserAvatar = $this->modx->getService('useravatar');
        $this->UserAvatar->initialize();

        $propKey = $this->getProperty('propkey');
        if (empty($propKey)) {
            return $this->UserAvatar->lexicon('err_propkey_ns');
        }

        $properties = $this->getProperty('properties', $this->UserAvatar->getProperties($propKey));
        $properties = (is_string($properties) AND strpos($properties, '{') === 0)
            ? $this->modx->fromJSON($properties)
            : $properties;
        if (empty($properties)) {
            return $this->UserAvatar->lexicon('err_properties_ns');
        }
        $this->properties = $properties;

        if (
            $this->UserAvatar->getOption('salt', $properties, '12345678', true) !=
            $this->UserAvatar->getOption('salt', null, '12345678', true)
        ) {
            return $this->UserAvatar->lexicon('err_lock');
        }

        $primaryKey = $this->getProperty($this->primaryKeyField, $this->modx->user->id);
        if (!$this->object = $this->modx->getObject($this->classKey, $primaryKey)) {
            return $this->modx->lexicon($this->objectType . '_err_nfs',
                array($this->primaryKeyField => $primaryKey));
        }

        $checkFile = $this->checkFile();
        if ($checkFile !== true) {
            return $checkFile;
        }

        return true;
    }


    protected function checkFile()
    {
        if (empty($_FILES['file'])) {
            return $this->UserAvatar->lexicon('err_file_ns');
        }
        if (!file_exists($_FILES['file']['tmp_name']) OR !is_uploaded_file($_FILES['file']['tmp_name'])) {
            return $this->UserAvatar->lexicon('err_file_ns');
        }
        if ($_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            return $this->UserAvatar->lexicon('err_file_ns');
        }

        $tnm = $_FILES['file']['tmp_name'];
        $name = $_FILES['file']['name'];

        $size = @filesize($tnm);

        $tim = getimagesize($tnm);
        $width = $height = 0;
        if (is_array($tim)) {
            $width = $tim[0];
            $height = $tim[1];
        }

        $type = explode('.', $name);
        $type = end($type);
        $name = rtrim(str_replace($type, '', $name), '.');
        $hash = hash_file('sha1', $tnm);

        $this->data = array(
            'tmp_name'   => $tnm,
            'size'       => $size,
            'type'       => $type,
            'name'       => $name,
            'width'      => $width,
            'height'     => $height,
            'hash'       => $hash,
            'properties' => $this->modx->toJSON(array(
                'w' => $width,
                'h' => $height,
                'f' => $type
            ))
        );

        return true;

    }

    public function process()
    {
        /* Run the beforeSet method before setting the fields, and allow stoppage */
        $canSave = $this->beforeSet();
        if ($canSave !== true) {
            return $this->failure($canSave);
        }

        if ($this->getProperty('photo')) {
            $this->object->set('photo', $this->getProperty('photo'));
        }

        /* Run the beforeSave method and allow stoppage */
        $canSave = $this->beforeSave();
        if ($canSave !== true) {
            return $this->failure($canSave);
        }

        /* run object validation */
        if (!$this->object->validate()) {
            /** @var modValidator $validator */
            $validator = $this->object->getValidator();
            if ($validator->hasMessages()) {
                foreach ($validator->getMessages() as $message) {
                    $this->addFieldError($message['field'], $this->modx->lexicon($message['message']));
                }
            }
        }

        /* run the before save event and allow stoppage */
        $preventSave = $this->fireBeforeSaveEvent();
        if (!empty($preventSave)) {
            return $this->failure($preventSave);
        }

        if ($this->saveObject() == false) {
            return $this->failure($this->modx->lexicon($this->objectType . '_err_save'));
        }
        $this->afterSave();
        $this->fireAfterSaveEvent();
        $this->logManagerAction();

        return $this->cleanup();
    }

    /** {@inheritDoc} */
    public function beforeSet()
    {
        if (empty($this->data)) {
            return $this->UserAvatar->lexicon('err_file_ns');
        }

        $thumbnail = (array)$this->modx->getOption('thumbnail', $this->properties, array(), true);
        $thumbnail = array_merge($this->thumbnail, $thumbnail);

        $tmp = $this->modx->getOption('tmp_name', $this->data, '', true);
        $name = $this->modx->getOption('hash', $this->data, session_id(), true);
        $type = $this->modx->getOption('type', $this->data, '', true);
        $type = $this->modx->getOption('f', $thumbnail, $type, true);

        $avatarPath = trim($this->modx->getOption('path', $this->properties, 'useravatar/images', true));
        $avatarPath = rtrim($avatarPath, '/') . '/';

        $cacheManager = $this->modx->getCacheManager();
        /* does not exist */
        if (!file_exists(MODX_ASSETS_PATH . $avatarPath) OR !is_dir(MODX_ASSETS_PATH . $avatarPath)) {
            if (!$cacheManager->writeTree(MODX_ASSETS_PATH . $avatarPath)) {
                $this->modx->log(xPDO::LOG_LEVEL_ERROR,
                    "[UserAvatar] Could not create directory: " . MODX_ASSETS_PATH . $avatarPath);

                return false;
            }
        }

        /* remove old avatar */
        if ($this->object->get('photo')) {
            $old = MODX_BASE_PATH . $this->object->get('photo');
            if (file_exists($old)) {
                @unlink($old);
            }
            $this->setProperty('photo', '');
        }

        $file = $name . '.' . $type;
        $url = MODX_ASSETS_URL . $avatarPath . $file;
        $path = MODX_ASSETS_PATH . $avatarPath . $file;

        if (!class_exists('modPhpThumb')) {
            /** @noinspection PhpIncludeInspection */
            require MODX_CORE_PATH . 'model/phpthumb/modphpthumb.class.php';
        }
        /** @noinspection PhpParamsInspection */
        $phpThumb = new modPhpThumb($this->modx);
        $phpThumb->initialize();


        $cacheDir = $this->modx->getOption('useravatar_phpThumb_config_cache_directory', null,
            MODX_CORE_PATH . 'cache/phpthumb/');
        /* check to make sure cache dir is writable */
        if (!is_writable($cacheDir)) {
            if (!$this->modx->cacheManager->writeTree($cacheDir)) {
                $this->modx->log(modX::LOG_LEVEL_ERROR, '[phpThumbOf] Cache dir not writable: ' . $cacheDir);

                return false;
            }
        }

        $phpThumb->setParameter('config_cache_directory', $cacheDir);
        $phpThumb->setParameter('config_cache_disable_warning', true);
        $phpThumb->setParameter('config_allow_src_above_phpthumb', true);
        $phpThumb->setParameter('config_allow_src_above_docroot', true);
        $phpThumb->setParameter('allow_local_http_src', true);
        $phpThumb->setParameter('config_document_root', $this->modx->getOption('base_path', null, MODX_BASE_PATH));
        $phpThumb->setParameter('config_temp_directory', $cacheDir);
        $phpThumb->setParameter('config_max_source_pixels',
            $this->modx->getOption('useravatar_phpThumb_config_max_source_pixels', null, '26843546'));

        $phpThumb->setCacheDirectory();

        $phpThumb->setSourceFilename($tmp);
        foreach ($thumbnail as $k => $v) {
            $phpThumb->setParameter($k, $v);
        }

        if ($phpThumb->GenerateThumbnail()) {
            if ($phpThumb->renderToFile($path)) {
                $this->setProperty('photo', $url);
            } else {
                $this->modx->log(modX::LOG_LEVEL_ERROR, "[UserAvatar] Could not save rendered image to {$path}");
            }
        } else {
            $this->modx->log(modX::LOG_LEVEL_ERROR, "[UserAvatar] " . print_r($phpThumb->debugmessages, true));
        }

        return parent::beforeSet();
    }

    public function afterSave()
    {
        return true;
    }

}

return 'modWebUserAvatarUploadProcessor';
