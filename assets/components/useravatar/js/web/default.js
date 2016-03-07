/*
 * v 1.0.0
 */

var FileAPI = {
    debug: false,
    staticPath: UserAvatarConfig.assetsUrl + 'vendor/fileapi/FileAPI/'
};

var UserAvatar = {
    config: {
        fileapi: {
            accept: 'image/!*',
            imageSize: {
                minWidth: 200, minHeight: 200
            },
            elements: {
                active: {show: '.user-avatar-upload-progress', hide: '.user-avatar-upload-link'},
                preview: {
                    el: '.user-avatar-preview',
                    width: 200,
                    height: 200
                },
                progress: '.user-avatar-upload-progress'
            },
            maxSize: FileAPI.MB*10

        }
    },

    initialize: function (opts) {
        var config = $.extend(true, {}, this.config, opts);

        if (!$.fileapi) {
            document.writeln('<script src="' + config.assetsBaseUrl + 'components/useravatar/vendor/fileapi/FileAPI/FileAPI.min.js"><\/script>');
            document.writeln('<script src="' + config.assetsBaseUrl + 'components/useravatar/vendor/fileapi/FileAPI/FileAPI.exif.js"><\/script>');
            document.writeln('<script src="' + config.assetsBaseUrl + 'components/useravatar/vendor/fileapi/jquery.fileapi.min.js"><\/script>');
        }

        if (!$.Jcrop) {
            document.writeln('<style data-compiled-css>@import url(' + config.assetsBaseUrl + 'components/useravatar/vendor/jcrop/css/jquery.Jcrop.min.css); </style>');
            document.writeln('<script src="' + config.assetsBaseUrl + 'components/useravatar/vendor/jcrop/js/jquery.Jcrop.min.js"><\/script>');
        }

        if (!$.modal) {
            document.writeln('<style data-compiled-css>@import url(' + config.assetsBaseUrl + 'components/useravatar/vendor/modal/the-modal.css); </style>');
            document.writeln('<script src="' + config.assetsBaseUrl + 'components/useravatar/vendor/modal/jquery.the-modal.js"><\/script>');
        }

        $(document).ready(function () {
            var avatar = [];

            $('#' + config.propkey).each(function () {
                if (!this.id) {
                    console.log('[UserAvatar:Error] Initialization Error. Id required');
                    return;
                }

                var $this = $(this);
                var fileApiConfig = $.extend({}, config.fileapi, $(this).data());

                fileApiConfig.url = config.actionUrl;
                fileApiConfig.files = [{
                    src: fileApiConfig.avatar,
                }];

                fileApiConfig.data = {
                    action: 'avatar/upload',
                    propkey: config.propkey,
                    ctx: config.ctx
                };

                fileApiConfig.onSelect=  function (evt, ui){
                    var file = ui.files[0];
                    if( !FileAPI.support.transform ) {
                        alert('Your browser does not support Flash :(');
                    }
                    else if( file ){
                        $('.user-avatar-popup').modal({
                            closeOnEsc: true,
                            closeOnOverlayClick: false,
                            onOpen: function (overlay){
                                $(overlay).on('click', '.user-avatar-upload-btn', function (){
                                    $.modal().close();
                                    $this.fileapi('upload');
                                });
                                $('.user-avatar-upload-img', overlay).cropper({
                                    file: file,
                                    bgColor: '#fff',
                                    maxSize: [$(window).width()-100, $(window).height()-100],
                                    minSize: [200, 200],
                                    selection: '90%',
                                    onSelect: function (coords){
                                        $this.fileapi('crop', file, coords);
                                    }
                                });
                            }
                        }).open();
                    }

                };

                avatar.push(function (){
                    $this.fileapi(fileApiConfig);
                });

            });

            FileAPI.each(avatar, function (fn){
                fn();
            });

        });

    },


};

